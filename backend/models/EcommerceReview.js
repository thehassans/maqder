import mongoose from 'mongoose';

const ecommerceReviewSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceProduct', required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceOrder' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  images: [{ url: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  helpfulVotes: { type: Number, default: 0 },
  helpfulVoterIds: [{ type: String }],
  verifiedPurchase: { type: Boolean, default: false },
}, { timestamps: true });

// Prevent duplicate reviews from same email for same product
ecommerceReviewSchema.index({ productId: 1, customerEmail: 1 }, { unique: true, sparse: true });

export default mongoose.model('EcommerceReview', ecommerceReviewSchema);
