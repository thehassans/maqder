import mongoose from 'mongoose';

const khataTransactionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'KhataAccount', required: true },
  type: { type: String, enum: ['credit', 'payment'], required: true }, // 'credit' increases balance, 'payment' decreases balance
  amount: { type: Number, required: true },
  reference: { type: String }, // e.g., Invoice ID or Receipt Number
  date: { type: Date, default: Date.now },
  notes: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.KhataTransaction || mongoose.model('KhataTransaction', khataTransactionSchema);
