import mongoose from 'mongoose';

const khayyatLaundrySchema = new mongoose.Schema({
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
  pricePerPiece: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAssigned: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
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

khayyatLaundrySchema.index({ tenantId: 1, createdAt: -1 });

khayyatLaundrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('KhayyatLaundry', khayyatLaundrySchema);
