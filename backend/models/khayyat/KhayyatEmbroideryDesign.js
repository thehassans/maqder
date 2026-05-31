import mongoose from 'mongoose';

const i18nTextSchema = new mongoose.Schema({
  en: { type: String, default: '' },
  ar: { type: String, default: '' },
  ur: { type: String, default: '' },
  hi: { type: String, default: '' },
  bn: { type: String, default: '' }
}, { _id: false });

const khayyatEmbroideryDesignSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameI18n: {
    type: i18nTextSchema,
    default: () => ({})
  },
  image: {
    type: String,
    default: null
  },
  imageUpdatedAt: {
    type: Number,
    default: null
  },
  note: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

khayyatEmbroideryDesignSchema.index({ tenantId: 1, createdAt: -1 });

khayyatEmbroideryDesignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('KhayyatEmbroideryDesign', khayyatEmbroideryDesignSchema);
