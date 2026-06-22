import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  nameAr: { type: String },
  phone: { type: String },
  email: { type: String },
  address: {
    street: { type: String },
    district: { type: String },
    city: { type: String },
    cityAr: { type: String },
    country: { type: String, default: 'SA' },
  },
  managerName: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

branchSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
