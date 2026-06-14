import mongoose from 'mongoose';

const dnItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  poItemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Links directly to PO line item
  quantityDelivered: { type: Number, required: true, min: 0 },
  quantityInvoiced: { type: Number, default: 0, min: 0 }
}, { _id: true }); // Need _id to reference these items when invoicing

const deliveryNoteSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  dnNumber: { type: String, required: true },
  
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', index: true },
  
  status: { 
    type: String, 
    enum: ['pending_invoice', 'partially_invoiced', 'fully_invoiced', 'cancelled'], 
    default: 'pending_invoice' 
  },
  
  lineItems: [dnItemSchema],
  
  deliveryDate: { type: Date, default: Date.now },
  notes: { type: String },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

deliveryNoteSchema.index({ tenantId: 1, dnNumber: 1 }, { unique: true });
deliveryNoteSchema.index({ tenantId: 1, customerId: 1 });
deliveryNoteSchema.index({ tenantId: 1, status: 1 });

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);
export default DeliveryNote;
