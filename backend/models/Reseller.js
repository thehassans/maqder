import mongoose from 'mongoose';

const resellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  company: { type: String, default: '' },
  commissionRate: { type: Number, default: 0, min: 0, max: 100 },
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

resellerSchema.index({ isActive: 1 });

const Reseller = mongoose.model('Reseller', resellerSchema);
export default Reseller;
