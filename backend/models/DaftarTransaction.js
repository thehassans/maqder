import mongoose from 'mongoose';

const daftarTransactionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  daftarAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'DaftarAccount', required: true, index: true },
  type: { type: String, enum: ['CHARGE', 'PAYMENT', 'ADJUSTMENT'], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  referenceType: { type: String, enum: ['INVOICE', 'MANUAL'], default: 'MANUAL' },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // e.g., Invoice ID
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

daftarTransactionSchema.pre('save', function(next) {
  if (this.amount) this.amount = Math.round(this.amount * 100) / 100;
  if (this.balanceAfter) this.balanceAfter = Math.round(this.balanceAfter * 100) / 100;
  next();
});

export default mongoose.models.DaftarTransaction || mongoose.model('DaftarTransaction', daftarTransactionSchema);
