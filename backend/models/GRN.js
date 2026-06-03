import mongoose from 'mongoose';

const grnSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' }, // Optional, can be received without PO
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  grnNumber: { type: String, required: true },
  referenceNumber: { type: String }, // Supplier Invoice or Delivery Note number
  dateReceived: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft', 'received'], default: 'received' },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  lines: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'BakalaProduct' },
    productName: { type: String },
    barcode: { type: String },
    quantityReceived: { type: Number, required: true },
    costPrice: { type: Number },
    expiryDate: { type: Date },
    batchNumber: { type: String }
  }]
}, { timestamps: true });

grnSchema.index({ tenantId: 1, grnNumber: 1 }, { unique: true });

export default mongoose.models.GRN || mongoose.model('GRN', grnSchema);
