import mongoose from 'mongoose';

const saloonStaffSchema = new mongoose.Schema({
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true, 
    index: true 
  },
  nameEn: { 
    type: String, 
    required: true 
  },
  nameAr: { 
    type: String 
  },
  phone: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

const SaloonStaff = mongoose.model('SaloonStaff', saloonStaffSchema);

export default SaloonStaff;
