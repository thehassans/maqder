import mongoose from 'mongoose';

const laundryCustomerSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  fullName: { type: String, required: true },
  mobile: { type: String, required: true },
  whatsappEnabled: { type: Boolean, default: true },
  
  preferences: {
    starchLevel: { type: String, enum: ['none', 'light', 'heavy'], default: 'none' },
    foldingPreference: { type: String, enum: ['folded', 'on_hanger'], default: 'folded' },
    notes: { type: String }
  },
  
  outstandingBalance: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

laundryCustomerSchema.index({ tenantId: 1, mobile: 1 });
laundryCustomerSchema.index({ tenantId: 1, fullName: 'text' });

const LaundryCustomer = mongoose.model('LaundryCustomer', laundryCustomerSchema);
export default LaundryCustomer;
