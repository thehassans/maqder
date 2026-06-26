import mongoose from 'mongoose';

const zatcaQueueSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    unique: true,
  },
  invoiceNumber: { type: String, required: true },
  transactionType: {
    type: String,
    enum: ['B2C', 'B2B'],
    default: 'B2C',
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'reported', 'cleared', 'failed', 'cancelled'],
    default: 'queued',
    index: true,
  },
  priority: {
    type: Number,
    default: 0,
    enum: [0, 1, 2],
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 5,
  },
  nextRetryAt: {
    type: Date,
    default: null,
  },
  lastError: { type: String, default: '' },
  lastAttemptAt: { type: Date, default: null },
  queuedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: { type: Date, default: null },
  zatcaResponse: { type: mongoose.Schema.Types.Mixed, default: null },
  circuitBreakerTripped: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

zatcaQueueSchema.index({ status: 1, nextRetryAt: 1, priority: -1 });
zatcaQueueSchema.index({ tenantId: 1, status: 1 });

export default mongoose.model('ZatcaQueue', zatcaQueueSchema);
