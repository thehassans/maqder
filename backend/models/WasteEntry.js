import mongoose from 'mongoose';

const wasteEntrySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'BakalaProduct', required: true },
  productName: { type: String, required: true },
  primaryBarcode: { type: String },
  category: { type: String },

  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'PCS' },

  costPrice: { type: Number, default: 0 },
  retailPrice: { type: Number, default: 0 },
  wasteValue: { type: Number, default: 0 },

  reason: {
    type: String,
    enum: ['expired', 'damaged', 'spoiled', 'recalled', 'quality_rejection', 'other'],
    required: true,
  },
  reasonDetail: { type: String },

  batchNumber: { type: String },
  expiryDate: { type: Date },

  action: {
    type: String,
    enum: ['disposed', 'donated', 'returned_to_supplier', 'discounted', 'written_off'],
    default: 'disposed',
  },
  discountPercent: { type: Number, min: 0, max: 100, default: 0 },

  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordedAt: { type: Date, default: Date.now },

  notes: { type: String },
}, { timestamps: true });

wasteEntrySchema.index({ tenantId: 1, recordedAt: -1 });
wasteEntrySchema.index({ tenantId: 1, reason: 1 });
wasteEntrySchema.index({ tenantId: 1, productId: 1 });

export default mongoose.models.WasteEntry || mongoose.model('WasteEntry', wasteEntrySchema);
