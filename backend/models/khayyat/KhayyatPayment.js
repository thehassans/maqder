import mongoose from 'mongoose';

const khayyatPaymentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhayyatWorker',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['salary', 'per_stitching', 'bonus', 'advance', 'deduction'],
    default: 'salary'
  },
  description: {
    type: String,
    default: ''
  },
  stitchingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhayyatStitching',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

khayyatPaymentSchema.index({ tenantId: 1, workerId: 1 });
khayyatPaymentSchema.index({ workerId: 1, createdAt: -1 });

export default mongoose.model('KhayyatPayment', khayyatPaymentSchema);
