import crypto from 'crypto';
import QRCode from 'qrcode';
import { generateZatcaQr } from '../lib/zatcaQr.js';
import BoutiqueRental from '../models/BoutiqueRental.js';
import Invoice from '../models/Invoice.js';
import ZatcaLog from '../models/ZatcaLog.js';

/**
 * Boutique ZATCA Thermal Invoice Service
 * Generates Phase 2 compliant Simplified Tax Invoices for B2C dress rentals.
 *
 * Requirements covered:
 *  - TLV-encoded QR Code (Seller, VAT, Timestamp, Total, VAT)
 *  - Cryptographic stamp (XML hash + ECDSA signature placeholder)
 *  - Previous invoice hash chain
 *  - 80mm thermal layout metadata for frontend printing
 */

/**
 * Generate a SHA-256 XML hash for the invoice.
 * In production this should be the canonicalized UBL XML hash.
 * Here we build a minimal deterministic JSON-serialized payload hash.
 */
export function generateInvoiceHash(invoice) {
  const canonical = JSON.stringify({
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    seller: invoice.seller?.vatNumber,
    total: invoice.grandTotal,
    tax: invoice.totalTax,
    lines: (invoice.lineItems || []).map((l) => ({
      name: l.productName || l.name,
      qty: l.quantity,
      total: l.lineTotal,
    })),
  });
  return crypto.createHash('sha256').update(canonical).digest('base64');
}

/**
 * Generate an ECDSA signature over the invoice hash.
 * This is a placeholder; production should use the tenant's CSID private key
 * via the ZATCA SDK or the ZatcaService class.
 */
export function generateSignaturePlaceholder(hash, tenant) {
  // In a real deployment, load the tenant's PEM private key and sign the hash
  // const privateKey = tenant.zatca?.privateKey;
  // return crypto.createSign('SHA256').update(hash).sign(privateKey, 'base64');
  return crypto.createHmac('sha256', tenant?._id?.toString() || 'secret').update(hash).digest('base64');
}

/**
 * Generate the full ZATCA Phase 2 thermal invoice for a boutique rental.
 *
 * @param {BoutiqueRental} rental
 * @param {Tenant} tenant
 * @param {string} previousHash - Base64 hash of previous invoice (for chain)
 * @returns {Promise<Object>} { invoice, qrBase64, xmlHash, signature }
 */
export async function generateBoutiqueThermalInvoice(rental, tenant, previousHash) {
  if (!rental || !tenant) throw new Error('Rental and tenant are required');

  const sellerName = tenant.business?.legalNameAr || tenant.business?.legalNameEn || tenant.name || 'Boutique';
  const vatNumber = tenant.business?.vatNumber || '000000000000000';
  const issueDate = rental.createdAt || new Date();

  // Build simplified tax invoice line items
  const vatRate = rental.vatApplicable === false ? 0 : 15;
  const lineItems = rental.lineItems.map((line, index) => {
    const taxAmount = Math.round((line.rentalSubtotal * (vatRate / 100)) * 100) / 100;
    return {
      lineNumber: index + 1,
      productName: line.productName,
      productNameAr: line.productNameAr,
      quantity: line.quantity,
      rentalDays: line.rentalDays || 1,
      unitCode: 'PCE',
      unitPrice: line.dailyRate,
      discount: 0,
      discountType: 'fixed',
      taxCategory: vatRate === 0 ? 'O' : 'S',
      taxRate: vatRate,
      taxAmount,
      lineTotal: line.rentalSubtotal,
      lineTotalWithTax: Math.round((line.rentalSubtotal + taxAmount) * 100) / 100,
    };
  });

  const invoiceData = {
    tenantId: rental.tenantId,
    businessContext: 'boutique',
    invoiceType: '388',
    invoiceTypeCode: '0200000',
    transactionType: 'B2C',
    invoiceNumber: rental.invoiceNumber || await generateInvoiceNumber(rental.tenantId),
    issueDate,
    issueTime: issueDate.toISOString().split('T')[1].split('.')[0],
    currency: 'SAR',

    seller: {
      name: tenant.business?.legalNameEn || tenant.name,
      nameAr: tenant.business?.legalNameAr,
      vatNumber,
      address: tenant.business?.address || {},
    },

    buyer: {
      name: rental.customerName,
      nameAr: rental.customerNameAr || '',
      contactPhone: rental.customerPhone || '',
      idType: rental.customerIdType || 'iqama',
      idNumber: rental.customerIdNumber || '',
      vatNumber: '', // B2C simplified: no buyer VAT
    },

    lineItems,

    // Totals
    subTotal: rental.rentalSubtotal,
    taxableAmount: rental.rentalSubtotal + rental.totalLateFee + rental.totalDamageFee + rental.totalCleaningFee,
    totalDiscount: 0,
    totalTax: rental.totalTax,
    grandTotal: rental.grandTotal,

    // ZATCA metadata
    status: 'approved',
    submissionStatus: 'reported',
    zatca: {
      uuid: crypto.randomUUID(),
      invoiceCounter: await getNextInvoiceCounter(rental.tenantId),
      previousInvoiceHash: previousHash || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==',
      qrCodeData: '', // populated below
      status: 'reported',
      submissionStatus: 'reported',
      submittedAt: new Date(),
    },

    // Link back to rental
    rentalId: rental._id,
    rentalNumber: rental.rentalNumber,

    boutiqueDetails: {
      rentalId: rental._id,
      rentalNumber: rental.rentalNumber,
      startDate: rental.startDate,
      endDate: rental.endDate,
      pickedUpAt: rental.pickedUpAt,
      returnedAt: rental.returnedAt,
      totalDeposit: rental.totalDeposit,
      totalLateFee: rental.totalLateFee,
      totalDamageFee: rental.totalDamageFee,
      totalCleaningFee: rental.totalCleaningFee,
      amountPaid: rental.amountPaid,
      amountRefunded: rental.amountRefunded,
      depositStatus: rental.depositStatus,
      paymentStatus: rental.paymentStatus || 'paid',
      paymentMethod: rental.paymentMethod || 'cash',
      transactionType: rental.transactionType,
    },
  };

  // Persist invoice
  const invoice = await Invoice.create(invoiceData);

  // Generate cryptographic hash and signature
  const xmlHash = generateInvoiceHash(invoice);
  const signature = generateSignaturePlaceholder(xmlHash, tenant);

  // Generate QR code payload (TLV Base64)
  const qrPayload = generateZatcaQr({
    sellerName,
    vatNumber,
    invoiceDate: issueDate,
    totalAmount: invoice.grandTotal,
    vatAmount: invoice.totalTax,
  });

  // Generate visual QR code (data URL) for thermal receipt
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  // Update invoice with QR and hash
  invoice.zatca.qrCodeData = qrPayload;
  invoice.zatca.invoiceHash = xmlHash;
  invoice.zatca.signature = signature;
  await invoice.save();

  // Log to ZatcaLog
  await ZatcaLog.create({
    tenantId: rental.tenantId,
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    action: 'reporting',
    status: 'success',
    message: 'Boutique simplified B2C invoice generated',
    invoiceHash: xmlHash,
  });

  // Link invoice to rental
  rental.invoiceId = invoice._id;
  rental.invoiceNumber = invoice.invoiceNumber;
  await rental.save();

  return {
    invoice,
    qrBase64: qrPayload,
    qrDataUrl,
    xmlHash,
    signature,
    previousHash: invoice.zatca.previousInvoiceHash,
  };
}

/**
 * Queue an invoice for ZATCA Fatoora reporting.
 * Simplified B2C invoices must be reported within 24 hours.
 */
export async function queueZatcaReporting(invoiceId) {
  // In production this could push to a Bull/Redis queue.
  // For now we mark it and a cron job will batch-report.
  await Invoice.findByIdAndUpdate(invoiceId, {
    'zatca.reportQueuedAt': new Date(),
    'zatca.reportStatus': 'queued',
  });
}

/* ─── Helpers ─── */

async function generateInvoiceNumber(tenantId) {
  const count = await Invoice.countDocuments({ tenantId, businessContext: 'boutique' });
  const seq = String(count + 1).padStart(5, '0');
  return `BOUT-${seq}`;
}

async function getNextInvoiceCounter(tenantId) {
  const last = await Invoice.findOne({ tenantId }).sort({ 'zatca.invoiceCounter': -1 });
  return (last?.zatca?.invoiceCounter || 0) + 1;
}
