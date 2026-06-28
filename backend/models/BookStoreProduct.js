import mongoose from 'mongoose';

const bookStoreProductSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  nameAr: { type: String },
  isbn: { type: String, index: true },
  barcodes: [{ type: String }],
  primaryBarcode: { type: String, required: true },
  author: { type: String },
  authorAr: { type: String },
  publisher: { type: String },
  publisherAr: { type: String },
  genre: { type: String },
  language: { type: String, default: 'English' },
  edition: { type: String },
  publicationYear: { type: Number },
  coverType: { type: String, enum: ['hardcover', 'paperback', 'ebook', 'other'], default: 'paperback' },
  category: { type: String },
  subCategory: { type: String },
  series: { type: String },
  seriesName: { type: String, index: true },
  seriesNumber: { type: Number, default: null },
  seriesTotal: { type: Number, default: null },
  volume: { type: String },
  description: { type: String },
  unit: { type: String, default: 'PCS' },
  stockQuantity: { type: Number, default: 0 },
  minimumStockAlertLevel: { type: Number, default: 5 },
  costPrice: { type: Number, default: 0 },
  retailPrice: { type: Number, required: true, default: 0 },
  discountPrice: { type: Number, default: 0 },
  taxRate: { type: Number, default: 15 },
  isStationery: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  coverImage: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

bookStoreProductSchema.pre('save', function(next) {
  if (this.costPrice) this.costPrice = Math.round(this.costPrice * 100) / 100;
  if (this.retailPrice) this.retailPrice = Math.round(this.retailPrice * 100) / 100;
  if (this.discountPrice) this.discountPrice = Math.round(this.discountPrice * 100) / 100;
  next();
});

bookStoreProductSchema.index({ tenantId: 1, primaryBarcode: 1 }, { unique: true });
bookStoreProductSchema.index({ tenantId: 1, isbn: 1 });
bookStoreProductSchema.index({ tenantId: 1, seriesName: 1, seriesNumber: 1 });
bookStoreProductSchema.index({ tenantId: 1, name: 'text', author: 'text', publisher: 'text' });

export default mongoose.models.BookStoreProduct || mongoose.model('BookStoreProduct', bookStoreProductSchema);
