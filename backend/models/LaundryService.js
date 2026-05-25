import mongoose from 'mongoose';

const laundryServiceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['wash_fold', 'dry_clean', 'ironing', 'premium_care'],
    required: true
  },
  billingType: { 
    type: String, 
    enum: ['per_kg', 'per_piece'], 
    required: true 
  },
  basePrice: { type: Number, required: true, min: 0 },
  // ZATCA specific
  taxRate: { type: Number, default: 15 }, 
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

laundryServiceSchema.index({ tenantId: 1, category: 1 });
laundryServiceSchema.index({ tenantId: 1, isActive: 1 });

const LaundryService = mongoose.model('LaundryService', laundryServiceSchema);
export default LaundryService;
