import mongoose from 'mongoose';

const demoUserSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  businessType: { type: String, default: 'trading' },
  businessTypes: [{ type: String, default: [] }],
  trialStartDate: { type: Date, default: Date.now },
  trialEndDate: { type: Date, required: true },
  isUpgraded: { type: Boolean, default: false },
  upgradedAt: { type: Date, default: null },
  paymentId: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'SAR' },
  plan: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'professional' },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

demoUserSchema.index({ email: 1 }, { unique: true });

const DemoUser = mongoose.model('DemoUser', demoUserSchema);
export default DemoUser;
