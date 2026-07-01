import mongoose from 'mongoose';

const loyaltyPointsSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  customerEmail: { type: String, required: true, trim: true, lowercase: true },
  customerPhone: { type: String, default: '', trim: true },
  customerName: { type: String, default: '' },
  points: { type: Number, default: 0, min: 0 },
  lifetimePoints: { type: Number, default: 0, min: 0 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  transactions: [{
    type: { type: String, enum: ['earn', 'redeem', 'adjust', 'expire'], required: true },
    points: { type: Number, required: true },
    reason: { type: String, default: '' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceOrder' },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

loyaltyPointsSchema.index({ tenantId: 1, customerEmail: 1 }, { unique: true });

loyaltyPointsSchema.methods.addPoints = function(pts, reason, orderId) {
  this.points += pts;
  this.lifetimePoints += pts;
  this.transactions.push({ type: 'earn', points: pts, reason, orderId });
  this.updateTier();
  return this;
};

loyaltyPointsSchema.methods.redeemPoints = function(pts, reason, orderId) {
  if (this.points < pts) throw new Error('Insufficient points');
  this.points -= pts;
  this.transactions.push({ type: 'redeem', points: pts, reason, orderId });
  return this;
};

loyaltyPointsSchema.methods.updateTier = function() {
  const lp = this.lifetimePoints;
  if (lp >= 10000) this.tier = 'platinum';
  else if (lp >= 5000) this.tier = 'gold';
  else if (lp >= 1000) this.tier = 'silver';
  else this.tier = 'bronze';
};

export default mongoose.model('LoyaltyPoints', loyaltyPointsSchema);
