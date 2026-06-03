import mongoose from 'mongoose';

const bakalaShiftSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  openTime: { type: Date, required: true, default: Date.now },
  closeTime: { type: Date },
  openingFloat: { type: Number, default: 0 },
  expectedCash: { type: Number, default: 0 },
  declaredCash: { type: Number, default: 0 },
  totalMada: { type: Number, default: 0 },
  totalApplePay: { type: Number, default: 0 },
  totalStcPay: { type: Number, default: 0 },
  totalDaftar: { type: Number, default: 0 },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN', index: true }
}, { timestamps: true });

bakalaShiftSchema.pre('save', function(next) {
  const fields = ['openingFloat', 'expectedCash', 'declaredCash', 'totalMada', 'totalApplePay', 'totalStcPay', 'totalDaftar'];
  fields.forEach(field => {
    if (this[field]) {
      this[field] = Math.round(this[field] * 100) / 100;
    }
  });
  next();
});

export default mongoose.models.BakalaShift || mongoose.model('BakalaShift', bakalaShiftSchema);
