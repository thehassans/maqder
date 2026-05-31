import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const i18nTextSchema = new mongoose.Schema({
  en: { type: String, default: '' },
  ar: { type: String, default: '' },
  ur: { type: String, default: '' },
  hi: { type: String, default: '' },
  bn: { type: String, default: '' }
}, { _id: false });

const khayyatWorkerSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameI18n: {
    type: i18nTextSchema,
    default: () => ({})
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 4
  },
  paymentType: {
    type: String,
    enum: ['per_stitching', 'salary'],
    default: 'per_stitching'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  completedStitchings: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['en', 'ar', 'hi', 'ur', 'bn'],
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    default: 'worker',
    immutable: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

khayyatWorkerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

khayyatWorkerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

khayyatWorkerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.pendingAmount = this.totalEarnings - this.totalPaid;
  next();
});

khayyatWorkerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('KhayyatWorker', khayyatWorkerSchema);
