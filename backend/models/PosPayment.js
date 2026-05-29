import mongoose from 'mongoose';

const posPaymentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  provider: { type: String, default: 'custom' },
  terminalId: { type: String, default: '' },

  // The business context that initiated the payment (restaurant/saloon/laundry/etc.)
  source: { type: String, default: 'pos' },
  // Optional reference to the order this payment belongs to.
  orderType: { type: String, default: '' },
  orderId: { type: mongoose.Schema.Types.ObjectId },
  orderNumber: { type: String, default: '' },

  amount: { type: Number, required: true },
  currency: { type: String, default: 'SAR' },

  // Local lifecycle status driven by polling / webhook updates.
  status: {
    type: String,
    enum: ['pending', 'processing', 'approved', 'declined', 'cancelled', 'failed', 'expired'],
    default: 'pending',
    index: true
  },

  // Identifier returned by the payment provider for status polling.
  providerPaymentId: { type: String, default: '', index: true },
  providerReference: { type: String, default: '' },
  approvalCode: { type: String, default: '' },
  cardScheme: { type: String, default: '' },
  cardLast4: { type: String, default: '' },
  rrn: { type: String, default: '' },

  errorMessage: { type: String, default: '' },
  rawResponse: { type: mongoose.Schema.Types.Mixed },

  expiresAt: { type: Date },
  completedAt: { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

posPaymentSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export default mongoose.model('PosPayment', posPaymentSchema);
