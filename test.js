import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/maqder').then(async () => {
  const i18nTextSchema = new mongoose.Schema({
    en: { type: String, default: '' },
    ar: { type: String, default: '' }
  }, { _id: false });

  const schema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    nameI18n: { type: i18nTextSchema, default: () => ({}) },
    image: { type: String, default: null },
    imageUpdatedAt: { type: Number, default: null },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  const Model = mongoose.model('TestDesign', schema);
  try {
    const doc = new Model({
      tenantId: new mongoose.Types.ObjectId(),
      name: 'Test',
      image: 'test',
      price: 15,
      isActive: true
    });
    await doc.save();
    console.log("Success! Saved docs:", await Model.countDocuments());
  } catch (err) {
    console.error("Error saving:", err);
  }
  process.exit();
}).catch(console.error);
