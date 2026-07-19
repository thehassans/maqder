import mongoose from 'mongoose';

const khayyatCustomizationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['collar', 'pocket', 'bain', 'cuff', 'buttons', 'embroidery', 'fabricMaterial', 'fabricColor', 'measurements', 'thawbType'],
    required: true,
    index: true
  },
  nameEn: {
    type: String,
    required: true,
    trim: true
  },
  nameAr: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  extraPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

khayyatCustomizationSchema.index({ tenantId: 1, category: 1, sortOrder: 1 });

export default mongoose.model('KhayyatCustomization', khayyatCustomizationSchema);
