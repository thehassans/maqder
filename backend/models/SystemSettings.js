import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  gemini: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String },
    model: { type: String, default: 'gemini-2.5-flash' }
  }
}, {
  timestamps: true
});

systemSettingsSchema.index({ key: 1 }, { unique: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
