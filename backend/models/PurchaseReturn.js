import mongoose from 'mongoose';

const purchaseReturnSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  returnNumber: { type: String, required: true },
  referenceNumber: { type: String }, // Original supplier invoice or GRN number
  dateReturned: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft', 'completed'], default: 'completed' },
  returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  lines: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'BakalaProduct' },
    productName: { type: String },
    barcode: { type: String },
    quantityReturned: { type: Number, required: true },
    reason: { type: String } // e.g. 'expired', 'damaged'
  }]
}, { timestamps: true });

purchaseReturnSchema.index({ tenantId: 1, returnNumber: 1 }, { unique: true });

export default mongoose.models.PurchaseReturn || mongoose.model('PurchaseReturn', purchaseReturnSchema);
