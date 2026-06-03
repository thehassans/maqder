import mongoose from 'mongoose';

const workerHealthCertificateSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  certificateNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['VALID', 'EXPIRING_SOON', 'EXPIRED'], default: 'VALID' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

workerHealthCertificateSchema.pre('save', function(next) {
  const today = new Date();
  const diffDays = Math.ceil((this.expiryDate - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    this.status = 'EXPIRED';
  } else if (diffDays <= 30) {
    this.status = 'EXPIRING_SOON';
  } else {
    this.status = 'VALID';
  }
  next();
});

export default mongoose.models.WorkerHealthCertificate || mongoose.model('WorkerHealthCertificate', workerHealthCertificateSchema);
