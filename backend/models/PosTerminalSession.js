import mongoose from 'mongoose';

const deviceStatusSchema = new mongoose.Schema({
  scanner: { type: String, default: 'disconnected' },
  printer: { type: String, default: 'disconnected' },
  cashDrawer: { type: String, default: 'disconnected' },
  scale: { type: String, default: 'disconnected' },
}, { _id: false });

const posTerminalSessionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  // Unique browser tab / POS instance identifier so multiple tabs per user are tracked separately
  tabId: { type: String, required: true },
  openedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true, index: true },
  deviceStatus: { type: deviceStatusSchema, default: () => ({}) },
  // Optional: IP / user agent info if needed later
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Compound index so each user+tab can only have one active session row
posTerminalSessionSchema.index({ tenantId: 1, userId: 1, tabId: 1 }, { unique: true });
// TTL index: auto-delete sessions that have not sent a heartbeat in 3 minutes
posTerminalSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 180 });

export default mongoose.models.PosTerminalSession || mongoose.model('PosTerminalSession', posTerminalSessionSchema);
