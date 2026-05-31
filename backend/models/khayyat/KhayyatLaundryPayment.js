import mongoose from 'mongoose';

const khayyatLaundryPaymentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  laundryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhayyatLaundry',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

khayyatLaundryPaymentSchema.index({ tenantId: 1, laundryId: 1 });
khayyatLaundryPaymentSchema.index({ laundryId: 1, createdAt: -1 });

export default mongoose.model('KhayyatLaundryPayment', khayyatLaundryPaymentSchema);
