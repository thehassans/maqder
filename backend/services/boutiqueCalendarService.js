import BoutiqueProduct from '../models/BoutiqueProduct.js';
import BoutiqueRental from '../models/BoutiqueRental.js';

/**
 * Boutique Calendar Service
 * Handles availability checking, pricing, deposit logic, and status transitions
 * for the Ladies Boutique & Dress Rental module.
 */

const RENTAL_STATUSES_BLOCKING = ['reserved', 'picked_up', 'late_return', 'returned'];

/**
 * Check if a product is available for rental between startDate and endDate.
 * Considers existing rentals and the product's turnaroundHours buffer.
 *
 * Algorithm:
 *  1. Compute effective blocking window: [startDate, endDate + turnaroundHours]
 *  2. Query all rentals for this product that overlap that window.
 *  3. If overlapping rental count < product.rentalQuantity, it's available.
 *
 * @param {ObjectId} productId
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {ObjectId|null} excludeRentalId - Exclude self when editing
 * @returns {Promise<boolean>}
 */
export async function isProductAvailable(productId, startDate, endDate, excludeRentalId = null) {
  const product = await BoutiqueProduct.findById(productId);
  if (!product) throw new Error('Product not found');
  if (product.mode === 'FOR_SALE') return false;
  if (!product.rentalQuantity || product.rentalQuantity <= 0) return false;

  // Add turnaround buffer to endDate so the dress can be cleaned/pressed before next rental
  const bufferMs = (product.turnaroundHours || 0) * 60 * 60 * 1000;
  const effectiveEnd = new Date(endDate.getTime() + bufferMs);

  const overlapQuery = {
    tenantId: product.tenantId,
    'lineItems.productId': productId,
    status: { $in: RENTAL_STATUSES_BLOCKING },
    $or: [
      // Existing rental starts within our window
      { startDate: { $gte: startDate, $lt: effectiveEnd } },
      // Existing rental ends within our window
      { endDate: { $gt: startDate, $lte: effectiveEnd } },
      // Existing rental completely covers our window
      { startDate: { $lte: startDate }, endDate: { $gte: effectiveEnd } },
    ],
  };

  if (excludeRentalId) {
    overlapQuery._id = { $ne: excludeRentalId };
  }

  const overlappingCount = await BoutiqueRental.countDocuments(overlapQuery);
  return overlappingCount < product.rentalQuantity;
}

/**
 * Check availability for multiple products in a single call.
 * Returns a Map<productId, boolean>.
 *
 * @param {Array<{productId, startDate, endDate}>} requests
 * @param {ObjectId|null} excludeRentalId
 * @returns {Promise<Map<string, boolean>>}
 */
export async function checkAvailabilityBatch(requests, excludeRentalId = null) {
  const results = new Map();
  await Promise.all(
    requests.map(async (req) => {
      const available = await isProductAvailable(req.productId, req.startDate, req.endDate, excludeRentalId);
      results.set(String(req.productId), available);
    })
  );
  return results;
}

/**
 * Calculate rental pricing for a line item.
 * Uses tiered rates if available, otherwise falls back to dailyRate.
 *
 * @param {BoutiqueProduct} product
 * @param {number} days
 * @returns {number} rentalSubtotal in SAR
 */
export function calculateRentalPrice(product, days) {
  if (!product || days <= 0) return 0;

  // Sort tiers ascending by days
  const tiers = (product.rentalRates || []).slice().sort((a, b) => a.days - b.days);

  // Try exact tier match first
  const exactTier = tiers.find((t) => t.days === days);
  if (exactTier) return exactTier.rate;

  // If days exceed largest tier, use largest tier + prorated daily rate for remainder
  const largestTier = tiers.length > 0 ? tiers[tiers.length - 1] : null;
  if (largestTier && days > largestTier.days) {
    const extraDays = days - largestTier.days;
    const daily = product.dailyRate || (largestTier.rate / largestTier.days);
    return largestTier.rate + (extraDays * daily);
  }

  // If days are between two tiers, use the tier just below + prorated daily for remainder
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (days >= tiers[i].days) {
      const extraDays = days - tiers[i].days;
      const daily = product.dailyRate || (tiers[i].rate / tiers[i].days);
      return tiers[i].rate + (extraDays * daily);
    }
  }

  // Fallback: flat daily rate
  const daily = product.dailyRate || 0;
  return days * daily;
}

/**
 * Compute full rental totals from line items + fees.
 *
 * @param {Array} lineItems
 * @param {number} vatRate  (default 15)
 * @returns {Object} { rentalSubtotal, totalDeposit, totalTax, grandTotal }
 */
export function computeRentalTotals(lineItems, vatRate = 15) {
  const rentalSubtotal = lineItems.reduce((sum, line) => sum + (line.rentalSubtotal || 0), 0);
  const totalDeposit = lineItems.reduce((sum, line) => sum + (line.depositAmount || 0), 0);
  const totalLateFee = lineItems.reduce((sum, line) => sum + (line.lateFee || 0), 0);
  const totalDamageFee = lineItems.reduce((sum, line) => sum + (line.damageFee || 0), 0);
  const totalCleaningFee = lineItems.reduce((sum, line) => sum + (line.cleaningFee || 0), 0);

  const taxableBase = rentalSubtotal + totalLateFee + totalDamageFee + totalCleaningFee;
  const totalTax = Math.round(taxableBase * (vatRate / 100) * 100) / 100;
  const grandTotal = Math.round((taxableBase + totalTax) * 100) / 100;

  return {
    rentalSubtotal: Math.round(rentalSubtotal * 100) / 100,
    totalDeposit: Math.round(totalDeposit * 100) / 100,
    totalLateFee: Math.round(totalLateFee * 100) / 100,
    totalDamageFee: Math.round(totalDamageFee * 100) / 100,
    totalCleaningFee: Math.round(totalCleaningFee * 100) / 100,
    totalTax,
    grandTotal,
  };
}

/**
 * Build normalized line items from raw frontend payload.
 * Fetches current product pricing and calculates subtotals.
 *
 * @param {Array<{productId, quantity, rentalDays}>} rawItems
 * @param {ObjectId} tenantId
 * @returns {Promise<Array>}
 */
export async function enrichRentalLineItems(rawItems, tenantId, transactionType = 'rental') {
  const normalized = [];
  const productIds = [...new Set(rawItems.map((i) => String(i.productId)))];
  const products = await BoutiqueProduct.find({ _id: { $in: productIds }, tenantId });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  for (const raw of rawItems) {
    const product = productMap.get(String(raw.productId));
    if (!product) throw new Error(`Product not found: ${raw.productId}`);

    const isSale = transactionType === 'sale';
    if (!isSale && product.mode === 'FOR_SALE') {
      throw new Error(`Product ${product.sku} is not available for rent`);
    }

    const days = isSale ? 1 : Math.max(1, Number(raw.rentalDays) || 1);
    const rentalSubtotal = isSale
      ? (product.salePrice || 0)
      : calculateRentalPrice(product, days);
    const depositAmount = isSale ? 0 : (product.securityDeposit || 0);

    normalized.push({
      productId: product._id,
      productName: product.name,
      productNameAr: product.nameAr,
      sku: product.sku,
      size: product.size,
      color: product.color,
      quantity: Math.max(1, Number(raw.quantity) || 1),
      dailyRate: isSale ? product.salePrice : (product.dailyRate || (product.rentalRates?.[0]?.rate || 0)),
      rentalDays: days,
      rentalSubtotal,
      depositAmount,
      lateFee: 0,
      damageFee: 0,
      cleaningFee: 0,
      lineTotal: rentalSubtotal,
    });
  }

  return normalized;
}

/**
 * Advance rental status and push audit entry.
 *
 * @param {BoutiqueRental} rental
 * @param {string} newStatus
 * @param {ObjectId} userId
 * @param {string} note
 * @returns {Promise<BoutiqueRental>}
 */
export async function transitionRentalStatus(rental, newStatus, userId, note = '') {
  const allowed = getAllowedTransitions(rental.status);
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid transition: ${rental.status} -> ${newStatus}`);
  }

  const fromStatus = rental.status;
  rental.status = newStatus;

  // Auto-set timestamps
  if (newStatus === 'picked_up') rental.pickedUpAt = new Date();
  if (newStatus === 'returned') rental.returnedAt = new Date();

  rental.updateHistory = rental.updateHistory || [];
  rental.updateHistory.push({
    updatedAt: new Date(),
    updatedBy: userId,
    fromStatus,
    toStatus: newStatus,
    note,
  });

  await rental.save();
  return rental;
}

/**
 * Valid state transitions.
 */
function getAllowedTransitions(current) {
  const map = {
    draft: ['reserved', 'cancelled'],
    reserved: ['picked_up', 'cancelled'],
    picked_up: ['late_return', 'returned'],
    late_return: ['returned'],
    returned: ['inspected'],
    inspected: ['closed', 'disputed'],
    closed: [],
    cancelled: [],
    disputed: ['closed'],
  };
  return map[current] || [];
}

/**
 * Daily CRON helper: find rentals that are overdue and mark them.
 * @returns {Promise<number>} count of newly flagged rentals
 */
export async function flagOverdueRentals() {
  const now = new Date();
  const result = await BoutiqueRental.updateMany(
    {
      status: 'picked_up',
      endDate: { $lt: now },
    },
    {
      $set: { status: 'late_return' },
      $push: {
        updateHistory: {
          updatedAt: now,
          fromStatus: 'picked_up',
          toStatus: 'late_return',
          note: 'Auto-flagged: past return date',
        },
      },
    }
  );
  return result.modifiedCount || 0;
}
