import express from 'express';
import TravelBooking from '../models/TravelBooking.js';
import Invoice from '../models/Invoice.js';
import Tenant from '../models/Tenant.js';
import { protect, tenantFilter, checkPermission, requireBusinessType } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);
router.use(requireBusinessType('travel_agency'));

async function generateBookingNumber(tenantFilterValue) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const prefix = `TB-${y}${m}${d}`;

  const last = await TravelBooking.findOne({
    ...tenantFilterValue,
    bookingNumber: { $regex: `^${prefix}-` },
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .select('bookingNumber');

  let seq = 1;
  if (last?.bookingNumber) {
    const parts = last.bookingNumber.split('-');
    const lastSeq = Number(parts[parts.length - 1]);
    if (Number.isFinite(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeTotals(payload) {
  const subtotal = toNumber(payload?.subtotal, 0);
  const totalTax = toNumber(payload?.totalTax, 0);
  const grandTotal = toNumber(payload?.grandTotal, subtotal + totalTax);

  return {
    subtotal,
    totalTax,
    grandTotal,
  };
}

router.get('/', checkPermission('travel', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 25, search, status, serviceType } = req.query;

    const query = { ...req.tenantFilter, isActive: true };

    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;

    if (search) {
      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const bookings = await TravelBooking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TravelBooking.countDocuments(query);

    res.json({
      bookings,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', checkPermission('travel', 'read'), async (req, res) => {
  try {
    const stats = await TravelBooking.aggregate([
      { $match: { ...req.tenantFilter, isActive: true } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                revenue: { $sum: '$grandTotal' },
                open: {
                  $sum: {
                    $cond: [{ $in: ['$status', ['draft', 'confirmed', 'ticketed']] }, 1, 0],
                  },
                },
              },
            },
          ],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byServiceType: [{ $group: { _id: '$serviceType', count: { $sum: 1 } } }],
        },
      },
    ]);

    res.json(stats?.[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkPermission('travel', 'read'), async (req, res) => {
  try {
    const booking = await TravelBooking.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/create-invoice', checkPermission('travel', 'update'), checkPermission('invoicing', 'create'), async (req, res) => {
  try {
    const booking = await TravelBooking.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.invoiceId) {
      const existing = await Invoice.findOne({ _id: booking.invoiceId, ...req.tenantFilter });
      if (existing) {
        return res.json({ invoice: existing, booking });
      }
    }

    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const lastInvoice = await Invoice.findOne({ tenantId: req.user.tenantId })
      .sort({ createdAt: -1 })
      .select('invoiceNumber');

    let invoiceCount = 1;
    if (lastInvoice?.invoiceNumber) {
      const maybe = parseInt(String(lastInvoice.invoiceNumber).split('-').pop());
      if (Number.isFinite(maybe)) invoiceCount = maybe + 1;
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount).padStart(6, '0')}`;

    const subtotal = toNumber(booking.subtotal, 0);
    const totalTax = toNumber(booking.totalTax, 0);
    const taxRate = subtotal > 0 ? Math.round((totalTax / subtotal) * 10000) / 100 : 0;

    const invoice = await Invoice.create({
      tenantId: req.user.tenantId,
      flow: 'sell',
      invoiceNumber,
      transactionType: 'B2C',
      invoiceTypeCode: '0200000',
      issueDate: new Date(),
      currency: booking.currency || 'SAR',
      contractNumber: booking.bookingNumber,
      seller: {
        name: tenant.business.legalNameEn,
        nameAr: tenant.business.legalNameAr,
        vatNumber: tenant.business.vatNumber,
        crNumber: tenant.business.crNumber,
        address: tenant.business.address,
      },
      buyer: {
        name: booking.customerName,
        contactEmail: booking.customerEmail,
        contactPhone: booking.customerPhone,
      },
      lineItems: [
        {
          lineNumber: 1,
          productName: `Travel Booking ${booking.bookingNumber}`,
          description: booking.serviceType ? `Service: ${booking.serviceType}` : undefined,
          quantity: 1,
          unitCode: 'PCE',
          unitPrice: subtotal,
          taxRate,
          taxCategory: 'S',
        },
      ],
      createdBy: req.user._id,
    });

    const updatedBooking = await TravelBooking.findOneAndUpdate(
      { _id: booking._id, ...req.tenantFilter },
      { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, invoicedAt: new Date() },
      { new: true }
    );

    res.status(201).json({ invoice, booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPermission('travel', 'create'), async (req, res) => {
  try {
    if (!req.user.tenantId) {
      return res.status(400).json({ error: 'No tenant associated with user' });
    }

    const bookingNumber = req.body.bookingNumber || (await generateBookingNumber(req.tenantFilter));
    const totals = normalizeTotals(req.body);

    const booking = await TravelBooking.create({
      ...req.body,
      ...totals,
      bookingNumber,
      tenantId: req.user.tenantId,
      createdBy: req.user._id,
    });

    res.status(201).json(booking);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Duplicate booking number' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkPermission('travel', 'update'), async (req, res) => {
  try {
    const existing = await TravelBooking.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });

    const totals = normalizeTotals(req.body);

    const updated = await TravelBooking.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { ...req.body, ...totals },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPermission('travel', 'delete'), async (req, res) => {
  try {
    const booking = await TravelBooking.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { isActive: false },
      { new: true }
    );

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    res.json({ message: 'Booking deactivated', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
