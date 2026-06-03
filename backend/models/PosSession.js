import mongoose from 'mongoose';

const posSessionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  openedAt: { type: Date, required: true, default: Date.now },
  closedAt: { type: Date },
  openingBalance: { type: Number, required: true, default: 0 },
  cashDrops: [{
    amount: { type: Number, required: true },
    reason: { type: String },
    time: { type: Date, default: Date.now }
  }],
  expectedClosingBalance: { type: Number }, // System calculated based on sales
  actualClosingBalance: { type: Number }, // Blind count entered by cashier
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.models.PosSession || mongoose.model('PosSession', posSessionSchema);
