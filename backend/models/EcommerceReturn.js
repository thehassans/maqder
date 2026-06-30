import mongoose from 'mongoose';

const ecommerceReturnSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceOrder', required: true },
  orderNumber: { type: String, required: true },
  returnNumber: { type: String, required: true },
  // Customer info (denormalized from order)
  customerName: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  // Items being returned
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceProduct' },
    productTitle: String,
    sku: String,
    price: Number,
    quantity: Number,
    returnReason: { type: String, default: '' },
  }],
  // Return details
  reason: { type: String, enum: ['damaged', 'wrong_item', 'not_as_described', 'changed_mind', 'quality_issue', 'other'], default: 'other' },
  reasonDetails: { type: String, default: '' },
  refundAmount: { type: Number, default: 0 },
  refundMethod: { type: String, enum: ['original', 'store_credit', 'manual'], default: 'original' },
  // Status workflow: requested → approved → received → refunded → completed
  //                   ↓ rejected
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'received', 'refunded', 'completed'],
    default: 'requested',
    index: true,
  },
  // Admin
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  adminNotes: { type: String, default: '' },
  // Tracking return shipment
  returnTrackingNumber: { type: String, default: '' },
  returnCourier: { type: String, default: '' },
  // Images of damaged/defective items
  images: [{ type: String }],
  // Timestamps
  requestedAt: { type: Date, default: Date.now },
  receivedAt: { type: Date },
  refundedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

// Auto-generate return number
ecommerceReturnSchema.pre('validate', async function(next) {
  if (this.returnNumber) return next();
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const count = await mongoose.models.EcommerceReturn.countDocuments({ tenantId: this.tenantId });
  this.returnNumber = `RET-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  next();
});

export default mongoose.model('EcommerceReturn', ecommerceReturnSchema);
