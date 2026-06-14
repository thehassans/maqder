import mongoose from 'mongoose';
import PurchaseOrder from '../models/PurchaseOrder.js';
import DeliveryNote from '../models/DeliveryNote.js';

export const createDeliveryNoteFromPO = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { poId, deliveryItems } = req.body; // deliveryItems: [{ poItemId, quantityDelivered }]
    const tenantId = req.user.tenantId;

    const po = await PurchaseOrder.findOne({ _id: poId, tenantId }).session(session);
    if (!po) {
      throw new Error('Purchase Order not found');
    }
    if (po.flow !== 'sell') {
      throw new Error('Purchase Order is not a Sales Order (flow must be sell)');
    }
    if (['delivered', 'closed', 'cancelled'].includes(po.status)) {
      throw new Error(`Purchase Order is already ${po.status}`);
    }

    const dnItems = [];
    let isFullyDelivered = true;

    for (const dItem of deliveryItems) {
      const poItem = po.lineItems.id(dItem.poItemId);
      if (!poItem) throw new Error(`PO Item ${dItem.poItemId} not found`);

      const remainingQty = poItem.quantityOrdered - (poItem.quantityDelivered || 0);
      if (dItem.quantityDelivered > remainingQty) {
        throw new Error(`Cannot deliver more than ordered for Product ${poItem.productId}`);
      }

      // Update PO Item delivered quantity
      poItem.quantityDelivered = (poItem.quantityDelivered || 0) + dItem.quantityDelivered;

      dnItems.push({
        productId: poItem.productId,
        poItemId: poItem._id,
        quantityDelivered: dItem.quantityDelivered,
        quantityInvoiced: 0
      });
    }

    // Check overall PO status
    po.lineItems.forEach(item => {
      if ((item.quantityDelivered || 0) < item.quantityOrdered) {
        isFullyDelivered = false;
      }
    });

    po.status = isFullyDelivered ? 'delivered' : 'partially_delivered';
    await po.save({ session });

    // Generate DN Number
    const lastDn = await DeliveryNote.findOne({ tenantId }).sort({ createdAt: -1 }).session(session);
    let seq = 1;
    if (lastDn && lastDn.dnNumber && lastDn.dnNumber.includes('-')) {
      const parts = lastDn.dnNumber.split('-');
      seq = parseInt(parts[parts.length - 1], 10) + 1;
    }
    const dnNumber = `DN-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    // Create Delivery Note
    const dn = new DeliveryNote({
      tenantId,
      dnNumber,
      customerId: po.customerId,
      purchaseOrderId: po._id,
      status: 'pending_invoice',
      lineItems: dnItems,
      createdBy: req.user._id
    });
    
    await dn.save({ session });

    await session.commitTransaction();
    res.status(201).json({ message: 'Delivery Note created successfully', deliveryNote: dn, poStatus: po.status });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
