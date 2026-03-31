import express from 'express';
import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Tenant from '../models/Tenant.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import RestaurantOrder from '../models/RestaurantOrder.js';
import TravelBooking from '../models/TravelBooking.js';
import { protect, tenantFilter, checkPermission, requireBusinessType } from '../middleware/auth.js';
import ZatcaService from '../utils/zatca/ZatcaService.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function postInventoryForInvoice(invoice, tenantFilterValue) {
  const warehouseId = invoice.warehouseId || invoice?.inventory?.warehouseId;
  if (!warehouseId) {
    throw new Error('warehouseId is required to post inventory');
  }

  const warehouse = await Warehouse.findOne({ _id: warehouseId, ...tenantFilterValue, isActive: true });
  if (!warehouse) {
    throw new Error('Warehouse not found');
  }

  if (invoice.inventory?.postedAt) {
    return invoice;
  }

  for (const line of invoice.lineItems || []) {
    const productId = line.productId;
    if (!productId) continue;

    const qty = toNumber(line.quantity, 0);
    if (qty <= 0) continue;

    const product = await Product.findOne({ _id: productId, ...tenantFilterValue });
    if (!product) {
      throw new Error('Product not found');
    }

    const sign = invoice.flow === 'sell' ? -1 : 1;
    if (sign < 0) {
      const stock = product.stocks.find((s) => s.warehouseId?.toString() === warehouseId.toString());
      const available = toNumber(stock?.quantity, 0) - toNumber(stock?.reservedQuantity, 0);
      if (available < qty) {
        throw new Error('Insufficient stock in selected warehouse');
      }
    }

    product.updateStock(warehouseId, sign * qty);

    if (invoice.flow === 'purchase' && toNumber(line.unitPrice, 0) > 0) {
      product.calculateLandedCost({
        purchasePrice: toNumber(line.unitPrice, 0),
        quantity: qty,
        notes: `Invoice ${invoice.invoiceNumber}`
      });
    }

    await product.save();
  }

  invoice.inventory = {
    ...(invoice.inventory || {}),
    warehouseId,
    postedAt: new Date(),
    reversedAt: null
  };

  await invoice.save();
  return invoice;
}

async function syncCustomerStats(tenantId, customerId) {
  try {
    if (!tenantId || !customerId) return;
    if (!mongoose.Types.ObjectId.isValid(tenantId) || !mongoose.Types.ObjectId.isValid(customerId)) return;

    const tenantObjectId = new mongoose.Types.ObjectId(String(tenantId));
    const customerObjectId = new mongoose.Types.ObjectId(String(customerId));

    const stats = await Invoice.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          customerId: customerObjectId,
          status: { $nin: ['draft', 'cancelled', 'credited'] }
        }
      },
      {
        $group: {
          _id: '$customerId',
          totalInvoices: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' },
          lastInvoiceDate: { $max: '$issueDate' }
        }
      }
    ]);

    const doc = stats[0];

    await Customer.updateOne(
      { _id: customerObjectId, tenantId: tenantObjectId },
      doc
        ? {
            totalInvoices: doc.totalInvoices,
            totalRevenue: doc.totalRevenue,
            lastInvoiceDate: doc.lastInvoiceDate
          }
        : { totalInvoices: 0, totalRevenue: 0, lastInvoiceDate: null }
    );
  } catch (error) {
    console.error('Failed to sync customer stats', error);
  }
}

// @route   GET /api/invoices
router.get('/', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, transactionType, search, startDate, endDate } = req.query;
    
    const query = { ...req.tenantFilter };
    if (status) query.status = status;
    if (transactionType) query.transactionType = transactionType;
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'buyer.name': { $regex: search, $options: 'i' } },
        { 'buyer.vatNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    const invoices = await Invoice.find(query)
      .select('-zatca.signedXml -lineItems')
      .sort({ issueDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Invoice.countDocuments(query);
    
    res.json({
      invoices,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/invoices/stats
router.get('/stats', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      { $match: req.tenantFilter },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } }],
          byZatcaStatus: [{ $group: { _id: '$zatca.submissionStatus', count: { $sum: 1 } } }],
          byTransactionType: [
            { $match: { status: { $nin: ['draft', 'cancelled', 'credited'] } } },
            { $group: { _id: '$transactionType', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } }
          ],
          monthly: [
            { $match: { status: { $nin: ['draft', 'cancelled', 'credited'] } } },
            {
              $group: {
                _id: { year: { $year: '$issueDate' }, month: { $month: '$issueDate' } },
                count: { $sum: 1 },
                total: { $sum: '$grandTotal' },
                tax: { $sum: '$totalTax' }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
          ],
          totals: [
            { $match: { status: { $nin: ['draft', 'cancelled', 'credited'] } } },
            {
              $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                totalRevenue: { $sum: '$grandTotal' },
                totalTax: { $sum: '$totalTax' }
              }
            }
          ]
        }
      }
    ]);
    
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/invoices/:id
router.get('/:id', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/invoices
router.post('/', checkPermission('invoicing', 'create'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);

    const tenantId = req.user.tenantId;
    let customer = null;

    if (req.body.customerId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.customerId)) {
        return res.status(400).json({ error: 'Invalid customerId' });
      }

      customer = await Customer.findOne({ _id: req.body.customerId, ...req.tenantFilter });
      if (!customer) {
        return res.status(400).json({ error: 'Customer not found' });
      }
    } else if (req.body?.buyer?.vatNumber) {
      const vatNumber = String(req.body.buyer.vatNumber || '').trim();
      if (vatNumber) {
        customer = await Customer.findOne({ tenantId, vatNumber });
      }
    }

    const buyer = { ...(req.body.buyer || {}) };

    if (customer) {
      buyer.name = buyer.name || customer.name;
      buyer.nameAr = buyer.nameAr || customer.nameAr;
      buyer.vatNumber = buyer.vatNumber || customer.vatNumber;
      buyer.crNumber = buyer.crNumber || customer.crNumber;
      buyer.address = { ...(customer.address || {}), ...(buyer.address || {}) };
    }

    if (!buyer.name || !String(buyer.name).trim()) {
      buyer.name = 'Cash Customer';
      buyer.nameAr = buyer.nameAr || 'عميل نقدي';
    }
    
    // Generate invoice number
    const lastInvoice = await Invoice.findOne({ tenantId: req.user.tenantId })
      .sort({ createdAt: -1 })
      .select('invoiceNumber');
    
    const invoiceCount = lastInvoice 
      ? parseInt(lastInvoice.invoiceNumber.split('-').pop()) + 1 
      : 1;
    
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount).padStart(6, '0')}`;

    const transactionType = req.body.transactionType || 'B2C';
    const invoiceTypeCode = req.body.invoiceTypeCode || (transactionType === 'B2C' ? '0200000' : '0100000');
    const issueDate = req.body.issueDate ? new Date(req.body.issueDate) : new Date();
    
    const invoiceData = {
      ...req.body,
      tenantId: req.user.tenantId,
      invoiceNumber,
      transactionType,
      invoiceTypeCode,
      issueDate,
      buyer,
      customerId: customer?._id,
      seller: {
        name: tenant.business.legalNameEn,
        nameAr: tenant.business.legalNameAr,
        vatNumber: tenant.business.vatNumber,
        crNumber: tenant.business.crNumber,
        address: tenant.business.address
      },
      createdBy: req.user._id
    };
    
    const invoice = await Invoice.create(invoiceData);

    if (restaurantOrder) {
      await RestaurantOrder.updateOne(
        { _id: restaurantOrder._id, ...req.tenantFilter },
        { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, invoicedAt: new Date() }
      );
    }

    if (travelBooking) {
      await TravelBooking.updateOne(
        { _id: travelBooking._id, ...req.tenantFilter },
        { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, invoicedAt: new Date() }
      );
    }

    if (invoice.customerId) {
      await syncCustomerStats(invoice.tenantId, invoice.customerId);
    }

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/invoices/sell
router.post('/sell', checkPermission('invoicing', 'create'), async (req, res) => {
  try {
    const businessType = req.tenant?.businessType || 'trading';
    const tenant = await Tenant.findById(req.user.tenantId);

    const restaurantOrderId = req.body?.restaurantOrderId;
    const travelBookingId = req.body?.travelBookingId;
    let restaurantOrder = null;
    let travelBooking = null;

    if (restaurantOrderId) {
      if (businessType !== 'restaurant') {
        return res.status(403).json({ error: 'Not available for this business type' });
      }
      if (!mongoose.Types.ObjectId.isValid(restaurantOrderId)) {
        return res.status(400).json({ error: 'Invalid restaurantOrderId' });
      }
      restaurantOrder = await RestaurantOrder.findOne({ _id: restaurantOrderId, ...req.tenantFilter, isActive: true });
      if (!restaurantOrder) {
        return res.status(400).json({ error: 'Restaurant order not found' });
      }
    }

    if (travelBookingId) {
      if (businessType !== 'travel_agency') {
        return res.status(403).json({ error: 'Not available for this business type' });
      }
      if (!mongoose.Types.ObjectId.isValid(travelBookingId)) {
        return res.status(400).json({ error: 'Invalid travelBookingId' });
      }
      travelBooking = await TravelBooking.findOne({ _id: travelBookingId, ...req.tenantFilter, isActive: true });
      if (!travelBooking) {
        return res.status(400).json({ error: 'Travel booking not found' });
      }
    }

    if (businessType === 'trading') {
      if (!req.body.warehouseId) {
        return res.status(400).json({ error: 'warehouseId is required' });
      }

      const warehouse = await Warehouse.findOne({ _id: req.body.warehouseId, ...req.tenantFilter, isActive: true });
      if (!warehouse) {
        return res.status(400).json({ error: 'Warehouse not found' });
      }
    }

    const tenantId = req.user.tenantId;
    let customer = null;

    if (req.body.customerId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.customerId)) {
        return res.status(400).json({ error: 'Invalid customerId' });
      }

      customer = await Customer.findOne({ _id: req.body.customerId, ...req.tenantFilter });
      if (!customer) {
        return res.status(400).json({ error: 'Customer not found' });
      }
    } else if (req.body?.buyer?.vatNumber) {
      const vatNumber = String(req.body.buyer.vatNumber || '').trim();
      if (vatNumber) {
        customer = await Customer.findOne({ tenantId, vatNumber });
      }
    }

    const buyer = { ...(req.body.buyer || {}) };

    if (customer) {
      buyer.name = buyer.name || customer.name;
      buyer.nameAr = buyer.nameAr || customer.nameAr;
      buyer.vatNumber = buyer.vatNumber || customer.vatNumber;
      buyer.crNumber = buyer.crNumber || customer.crNumber;
      buyer.address = { ...(customer.address || {}), ...(buyer.address || {}) };
    }

    if (!buyer.name || !String(buyer.name).trim()) {
      buyer.name = 'Cash Customer';
      buyer.nameAr = buyer.nameAr || 'عميل نقدي';
    }

    const lastInvoice = await Invoice.findOne({ tenantId: req.user.tenantId })
      .sort({ createdAt: -1 })
      .select('invoiceNumber');

    const invoiceCount = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split('-').pop()) + 1
      : 1;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount).padStart(6, '0')}`;

    const transactionType = req.body.transactionType || 'B2C';
    const invoiceTypeCode = req.body.invoiceTypeCode || (transactionType === 'B2C' ? '0200000' : '0100000');
    const issueDate = req.body.issueDate ? new Date(req.body.issueDate) : new Date();

    const lineItems = (req.body.lineItems || []).map((line, i) => ({
      ...line,
      lineNumber: line.lineNumber || i + 1,
      taxCategory: line.taxCategory || 'S'
    }));

    const productIds = lineItems
      .map((li) => li.productId)
      .filter(Boolean)
      .map((id) => id.toString());
    const uniqueProductIds = [...new Set(productIds)];
    if (businessType === 'trading' && uniqueProductIds.length) {
      const existingCount = await Product.countDocuments({ _id: { $in: uniqueProductIds }, ...req.tenantFilter });
      if (existingCount !== uniqueProductIds.length) {
        return res.status(400).json({ error: 'Invalid product in line items' });
      }
    }

    const invoiceData = {
      ...req.body,
      tenantId: req.user.tenantId,
      flow: 'sell',
      invoiceNumber,
      transactionType,
      invoiceTypeCode,
      issueDate,
      buyer,
      customerId: customer?._id,
      seller: {
        name: tenant.business.legalNameEn,
        nameAr: tenant.business.legalNameAr,
        vatNumber: tenant.business.vatNumber,
        crNumber: tenant.business.crNumber,
        address: tenant.business.address
      },
      createdBy: req.user._id,
      lineItems
    };

    const invoice = await Invoice.create(invoiceData);

    if (invoice.customerId) {
      await syncCustomerStats(invoice.tenantId, invoice.customerId);
    }

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/invoices/purchase
router.post('/purchase', checkPermission('invoicing', 'create'), async (req, res) => {
  try {
    const businessType = req.tenant?.businessType || 'trading';
    if (businessType !== 'trading') {
      return res.status(403).json({ error: 'Not available for this business type' });
    }
    const tenant = await Tenant.findById(req.user.tenantId);

    if (!req.body.warehouseId) {
      return res.status(400).json({ error: 'warehouseId is required' });
    }

    const warehouse = await Warehouse.findOne({ _id: req.body.warehouseId, ...req.tenantFilter, isActive: true });
    if (!warehouse) {
      return res.status(400).json({ error: 'Warehouse not found' });
    }

    let supplier = null;
    if (req.body.supplierId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.supplierId)) {
        return res.status(400).json({ error: 'Invalid supplierId' });
      }

      supplier = await Supplier.findOne({ _id: req.body.supplierId, ...req.tenantFilter, isActive: true });
      if (!supplier) {
        return res.status(400).json({ error: 'Supplier not found' });
      }
    }

    const seller = { ...(req.body.seller || {}) };
    if (supplier) {
      seller.name = seller.name || supplier.nameEn;
      seller.nameAr = seller.nameAr || supplier.nameAr;
      seller.vatNumber = seller.vatNumber || supplier.vatNumber;
      seller.crNumber = seller.crNumber || supplier.crNumber;
      seller.address = { ...(supplier.address || {}), ...(seller.address || {}) };
      seller.contactPhone = seller.contactPhone || supplier.phone;
      seller.contactEmail = seller.contactEmail || supplier.email;
    }

    if (!seller.name || !String(seller.name).trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const lastInvoice = await Invoice.findOne({ tenantId: req.user.tenantId })
      .sort({ createdAt: -1 })
      .select('invoiceNumber');

    const invoiceCount = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split('-').pop()) + 1
      : 1;

    const invoiceNumber = `PINV-${new Date().getFullYear()}-${String(invoiceCount).padStart(6, '0')}`;

    const transactionType = req.body.transactionType || 'B2B';
    const invoiceTypeCode = req.body.invoiceTypeCode || '0100000';
    const issueDate = req.body.issueDate ? new Date(req.body.issueDate) : new Date();

    const lineItems = (req.body.lineItems || []).map((line, i) => ({
      ...line,
      lineNumber: line.lineNumber || i + 1,
      taxCategory: line.taxCategory || 'S'
    }));

    const productIds = lineItems
      .map((li) => li.productId)
      .filter(Boolean)
      .map((id) => id.toString());
    const uniqueProductIds = [...new Set(productIds)];
    if (uniqueProductIds.length) {
      const existingCount = await Product.countDocuments({ _id: { $in: uniqueProductIds }, ...req.tenantFilter });
      if (existingCount !== uniqueProductIds.length) {
        return res.status(400).json({ error: 'Invalid product in line items' });
      }
    }

    const invoiceData = {
      ...req.body,
      tenantId: req.user.tenantId,
      flow: 'purchase',
      invoiceNumber,
      transactionType,
      invoiceTypeCode,
      issueDate,
      seller,
      supplierId: supplier?._id,
      buyer: {
        name: tenant.business.legalNameEn,
        nameAr: tenant.business.legalNameAr,
        vatNumber: tenant.business.vatNumber,
        crNumber: tenant.business.crNumber,
        address: tenant.business.address
      },
      createdBy: req.user._id,
      lineItems
    };

    const invoice = await Invoice.create(invoiceData);
    const posted = await postInventoryForInvoice(invoice, req.tenantFilter);
    res.status(201).json(posted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/invoices/:id/post-inventory
router.post('/:id/post-inventory', requireBusinessType('trading'), checkPermission('invoicing', 'update'), async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!['draft', 'pending', 'approved'].includes(invoice.status)) {
      return res.status(400).json({ error: 'Inventory cannot be posted for this invoice status' });
    }

    if (req.body?.warehouseId && mongoose.Types.ObjectId.isValid(req.body.warehouseId)) {
      invoice.warehouseId = req.body.warehouseId;
    }

    if (!invoice.warehouseId) {
      return res.status(400).json({ error: 'warehouseId is required' });
    }

    const result = await postInventoryForInvoice(invoice, req.tenantFilter);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/invoices/:id
router.put('/:id', checkPermission('invoicing', 'update'), async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...req.tenantFilter });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    if (!['draft'].includes(invoice.status)) {
      return res.status(400).json({ error: 'Only draft invoices can be modified' });
    }
    
    Object.assign(invoice, req.body);
    await invoice.save();
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/invoices/:id/sign
router.post('/:id/sign', checkPermission('invoicing', 'approve'), async (req, res) => {
  try {
    const businessType = req.tenant?.businessType || 'trading';
    const invoice = await Invoice.findOne({ _id: req.params.id, ...req.tenantFilter });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.flow === 'purchase') {
      return res.status(400).json({ error: 'Cannot sign purchase invoices' });
    }
    
    if (invoice.zatca?.submissionStatus !== 'pending' && invoice.zatca?.signedXml) {
      return res.status(400).json({ error: 'Invoice already signed' });
    }

    if (businessType === 'trading' && invoice.flow === 'sell' && !invoice.inventory?.postedAt) {
      try {
        await postInventoryForInvoice(invoice, req.tenantFilter);
      } catch (err) {
        return res.status(400).json({ error: err.message || 'Failed to post inventory' });
      }
    }
    
    const tenant = await Tenant.findById(req.user.tenantId);
    
    if (!tenant.zatca?.privateKey) {
      return res.status(400).json({ error: 'ZATCA not configured for this tenant' });
    }
    
    const zatcaService = new ZatcaService({
      privateKey: tenant.zatca.privateKey,
      certificate: tenant.zatca.certificate,
      csid: tenant.zatca.productionCsid,
      previousInvoiceHash: tenant.zatca.lastInvoiceHash
    });
    
    const isB2C = invoice.transactionType === 'B2C';
    const zatcaResult = await zatcaService.processInvoice(invoice.toObject(), tenant.business, isB2C);
    
    invoice.zatca = {
      ...invoice.zatca,
      ...zatcaResult,
      signedXml: zatcaResult.xml
    };
    
    invoice.status = 'pending';
    await invoice.save();
    
    // Update tenant's invoice counter and hash
    await Tenant.findByIdAndUpdate(tenant._id, {
      'zatca.invoiceCounter': zatcaResult.invoiceCounter,
      'zatca.lastInvoiceHash': zatcaResult.invoiceHash
    });
    
    // For B2B, immediately submit for clearance
    if (!isB2C && tenant.zatca.isOnboarded) {
      const clearanceResult = await zatcaService.submitForClearance(
        zatcaResult.xml,
        zatcaResult.invoiceHash,
        zatcaResult.uuid
      );
      
      invoice.zatca.submissionStatus = clearanceResult.success ? 'cleared' : 'rejected';
      invoice.zatca.clearanceStatus = clearanceResult.clearanceStatus;
      invoice.zatca.zatcaResponse = clearanceResult;
      invoice.zatca.submittedAt = new Date();
      
      if (clearanceResult.success) {
        invoice.zatca.clearedAt = new Date();
        invoice.status = 'approved';
      } else {
        invoice.zatca.lastError = clearanceResult.errors?.join(', ') || clearanceResult.error;
      }
      
      await invoice.save();
    }

    if (invoice.customerId) {
      await syncCustomerStats(invoice.tenantId, invoice.customerId);
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/invoices/:id/qr
router.get('/:id/qr', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...req.tenantFilter })
      .select('zatca.qrCodeImage zatca.qrCodeData');
    
    if (!invoice || !invoice.zatca?.qrCodeImage) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    
    res.json({
      qrCodeImage: invoice.zatca.qrCodeImage,
      qrCodeData: invoice.zatca.qrCodeData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/invoices/:id/xml
router.get('/:id/xml', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...req.tenantFilter })
      .select('invoiceNumber zatca.signedXml');
    
    if (!invoice || !invoice.zatca?.signedXml) {
      return res.status(404).json({ error: 'XML not found' });
    }
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.xml"`);
    res.send(invoice.zatca.signedXml);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/invoices/:id/cancel
router.post('/:id/cancel', checkPermission('invoicing', 'update'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter, status: { $nin: ['cancelled', 'credited'] } },
      { status: 'cancelled', internalNotes: `Cancelled: ${reason}` },
      { new: true }
    );
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or cannot be cancelled' });
    }

    if (invoice.customerId) {
      await syncCustomerStats(invoice.tenantId, invoice.customerId);
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/invoices/:id/credit-note
router.post('/:id/credit-note', checkPermission('invoicing', 'create'), async (req, res) => {
  try {
    const originalInvoice = await Invoice.findOne({ _id: req.params.id, ...req.tenantFilter });
    
    if (!originalInvoice) {
      return res.status(404).json({ error: 'Original invoice not found' });
    }
    
    const tenant = await Tenant.findById(req.user.tenantId);
    
    const creditNoteNumber = `CN-${originalInvoice.invoiceNumber}`;
    
    const creditNote = await Invoice.create({
      ...originalInvoice.toObject(),
      _id: undefined,
      invoiceNumber: creditNoteNumber,
      invoiceType: '381',
      invoiceTypeCode: originalInvoice.transactionType === 'B2C' ? '0200100' : '0100100',
      originalInvoiceId: originalInvoice._id,
      status: 'draft',
      zatca: {},
      createdBy: req.user._id,
      createdAt: undefined,
      updatedAt: undefined
    });
    
    originalInvoice.status = 'credited';
    await originalInvoice.save();

    if (originalInvoice.customerId) {
      await syncCustomerStats(originalInvoice.tenantId, originalInvoice.customerId);
    }
    
    res.status(201).json(creditNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
