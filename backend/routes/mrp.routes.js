import express from 'express';
import Product from '../models/Product.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeReorderPoint(product) {
  const stocks = Array.isArray(product?.stocks) ? product.stocks : [];
  if (!stocks.length) return 10;

  const points = stocks
    .map((s) => safeNumber(s?.reorderPoint, 10))
    .filter((x) => Number.isFinite(x));

  if (!points.length) return 10;
  return Math.min(...points);
}

async function getIncomingMap(tenantFilterValue) {
  const pipeline = [
    {
      $match: {
        ...tenantFilterValue,
        status: { $in: ['sent', 'approved', 'partially_received'] }
      }
    },
    { $unwind: '$lineItems' },
    {
      $project: {
        productId: '$lineItems.productId',
        remaining: {
          $subtract: ['$lineItems.quantityOrdered', '$lineItems.quantityReceived']
        }
      }
    },
    { $match: { remaining: { $gt: 0 } } },
    { $group: { _id: '$productId', incomingQty: { $sum: '$remaining' } } }
  ];

  const incoming = await PurchaseOrder.aggregate(pipeline);
  return new Map(incoming.map((row) => [String(row._id), row.incomingQty || 0]));
}

router.get('/suggestions', checkPermission('mrp', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, multiplier = 2 } = req.query;

    const p = parseInt(page);
    const l = parseInt(limit);
    const mult = Math.max(1, safeNumber(multiplier, 2));

    const productQuery = { ...req.tenantFilter, isActive: true };

    if (search) {
      productQuery.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { nameAr: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    const [products, incomingMap] = await Promise.all([
      Product.find(productQuery)
        .select('sku nameEn nameAr category totalStock costPrice stocks')
        .sort({ createdAt: -1 })
        .lean(),
      getIncomingMap(req.tenantFilter)
    ]);

    const suggestions = (products || [])
      .map((prod) => {
        const reorderPoint = computeReorderPoint(prod);
        const currentStock = safeNumber(prod?.totalStock, 0);
        const incomingQty = safeNumber(incomingMap.get(String(prod._id)), 0);
        const projectedStock = currentStock + incomingQty;

        const targetStock = reorderPoint * mult;
        const recommendedQty = Math.max(0, targetStock - projectedStock);

        if (recommendedQty <= 0) return null;

        const costPrice = safeNumber(prod?.costPrice, 0);
        const estimatedCost = recommendedQty * costPrice;

        return {
          productId: prod._id,
          sku: prod.sku,
          nameEn: prod.nameEn,
          nameAr: prod.nameAr,
          category: prod.category,
          currentStock,
          incomingQty,
          projectedStock,
          reorderPoint,
          targetStock,
          recommendedQty,
          costPrice,
          estimatedCost
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.recommendedQty - a.recommendedQty);

    const total = suggestions.length;
    const pages = Math.ceil(total / l) || 1;
    const start = (p - 1) * l;

    res.json({
      suggestions: suggestions.slice(start, start + l),
      pagination: {
        page: p,
        limit: l,
        total,
        pages
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', checkPermission('mrp', 'read'), async (req, res) => {
  try {
    const { search, multiplier = 2 } = req.query;

    const mult = Math.max(1, safeNumber(multiplier, 2));

    const productQuery = { ...req.tenantFilter, isActive: true };

    if (search) {
      productQuery.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { nameAr: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    const [products, incomingMap] = await Promise.all([
      Product.find(productQuery)
        .select('sku nameEn nameAr category totalStock costPrice stocks')
        .lean(),
      getIncomingMap(req.tenantFilter)
    ]);

    const byCategory = new Map();

    let suggestionsCount = 0;
    let totalRecommendedQty = 0;
    let totalEstimatedCost = 0;
    let totalIncomingQty = 0;

    for (const prod of products || []) {
      const reorderPoint = computeReorderPoint(prod);
      const currentStock = safeNumber(prod?.totalStock, 0);
      const incomingQty = safeNumber(incomingMap.get(String(prod._id)), 0);
      const projectedStock = currentStock + incomingQty;

      totalIncomingQty += incomingQty;

      const targetStock = reorderPoint * mult;
      const recommendedQty = Math.max(0, targetStock - projectedStock);

      if (recommendedQty <= 0) continue;

      suggestionsCount += 1;
      totalRecommendedQty += recommendedQty;

      const costPrice = safeNumber(prod?.costPrice, 0);
      const estimatedCost = recommendedQty * costPrice;
      totalEstimatedCost += estimatedCost;

      const key = prod.category || 'Uncategorized';
      const current = byCategory.get(key) || { category: key, suggestions: 0, estimatedCost: 0 };
      byCategory.set(key, {
        category: key,
        suggestions: current.suggestions + 1,
        estimatedCost: current.estimatedCost + estimatedCost
      });
    }

    const categories = Array.from(byCategory.values()).sort((a, b) => b.estimatedCost - a.estimatedCost);

    res.json({
      totals: {
        suggestions: suggestionsCount,
        recommendedQty: totalRecommendedQty,
        estimatedCost: totalEstimatedCost,
        incomingQty: totalIncomingQty
      },
      byCategory: categories.slice(0, 12)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
