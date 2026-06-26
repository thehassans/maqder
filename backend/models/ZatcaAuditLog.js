import mongoose from 'mongoose';

const zatcaAuditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: [
      'key_rotation',
      'chain_recovery',
      'chain_verification',
      'qr_integrity_check',
      'certificate_renewal',
      'compliance_test',
      'manual_sync',
      'config_update',
      'security_alert',
      'disaster_recovery',
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  performedByRole: {
    type: String,
    enum: ['super_admin', 'admin', 'system'],
    default: 'system',
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  affectedInvoices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }],
  previousState: { type: mongoose.Schema.Types.Mixed },
  newState: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
});

zatcaAuditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });
zatcaAuditLogSchema.index({ severity: 1, createdAt: -1 });

export default mongoose.model('ZatcaAuditLog', zatcaAuditLogSchema);
