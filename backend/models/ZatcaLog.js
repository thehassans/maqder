import mongoose from 'mongoose';

const zatcaLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  invoiceNumber: { type: String, index: true },
  
  // E.g., 'reporting', 'clearance', 'onboarding'
  action: { type: String, required: true },
  
  // 'success', 'warning', 'error'
  status: { type: String, required: true },
  
  // ZATCA response data (warnings, errors)
  apiResponse: { type: mongoose.Schema.Types.Mixed },
  
  // E.g., validation messages or descriptions
  message: { type: String },

  // UUID from ZATCA if clearance/reporting succeeded
  uuid: { type: String },
  
  // If it was a reporting/clearance, hash of the invoice
  invoiceHash: { type: String }
}, {
  timestamps: true
});

zatcaLogSchema.index({ tenantId: 1, createdAt: -1 });
zatcaLogSchema.index({ tenantId: 1, status: 1 });

const ZatcaLog = mongoose.model('ZatcaLog', zatcaLogSchema);
export default ZatcaLog;
