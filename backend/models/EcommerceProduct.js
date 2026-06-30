import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
  sku: { type: String, default: '' },
  barcode: { type: String, default: '' },
  option1Name: { type: String, default: '' },
  option1Value: { type: String, default: '' },
  option2Name: { type: String, default: '' },
  option2Value: { type: String, default: '' },
  option3Name: { type: String, default: '' },
  option3Value: { type: String, default: '' },
  price: { type: Number, default: 0 },
  compareAtPrice: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0 },
  trackInventory: { type: Boolean, default: true },
  weight: { type: Number, default: 0 },
  imageIndex: { type: Number, default: -1 },
  isActive: { type: Boolean, default: true },
}, { _id: true });

const productImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  altText: { type: String, default: '' },
  position: { type: Number, default: 0 },
}, { _id: true });

const ecommerceProductSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  title: { type: String, required: true, trim: true },
  titleAr: { type: String, default: '', trim: true },
  description: { type: String, default: '' },
  descriptionAr: { type: String, default: '' },
  productType: { type: String, enum: ['physical', 'digital', 'service'], default: 'physical' },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', index: true },
  category: { type: String, default: '', index: true },
  tags: [{ type: String }],
  vendor: { type: String, default: '' },
  brand: { type: String, default: '' },
  // Pricing
  basePrice: { type: Number, default: 0 },
  compareAtPrice: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  taxRate: { type: Number, default: 15 },
  taxIncluded: { type: Boolean, default: true },
  currency: { type: String, default: 'SAR' },
  // Bulk pricing tiers
  priceTiers: { type: [{ minQty: Number, price: Number }], default: [] },
  // Variants
  hasVariants: { type: Boolean, default: false },
  option1Name: { type: String, default: '' },
  option2Name: { type: String, default: '' },
  option3Name: { type: String, default: '' },
  variants: { type: [productVariantSchema], default: [] },
  // Inventory (used when hasVariants is false)
  stockQuantity: { type: Number, default: 0 },
  trackInventory: { type: Boolean, default: true },
  continueSellingWhenOOS: { type: Boolean, default: false },
  sku: { type: String, default: '' },
  barcode: { type: String, default: '' },
  // Shipping
  weight: { type: Number, default: 0 },
  weightUnit: { type: String, enum: ['g', 'kg'], default: 'g' },
  requiresShipping: { type: Boolean, default: true },
  // Images
  images: { type: [productImageSchema], default: [] },
  // SEO
  seo: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    slug: { type: String, default: '' },
    ogImage: { type: String, default: '' },
  },
  // Analytics
  viewsCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  // External integrations
  integration: {
    wordpressProductId: { type: Number, default: null },
    source: { type: String, default: '' },
  },
  // Relations
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Back-in-stock notifications
  stockNotifications: [{
    email: { type: String, required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    notified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  // Product Q&A
  questions: [{
    question: { type: String, required: true },
    askerName: { type: String, default: '' },
    askerEmail: { type: String, default: '' },
    answer: { type: String, default: '' },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    answeredAt: { type: Date, default: null },
    isPublic: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// Auto-generate SEO slug from title if not provided
ecommerceProductSchema.pre('save', function(next) {
  if (!this.seo.slug && this.title) {
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }
  // Round prices
  if (this.basePrice) this.basePrice = Math.round(this.basePrice * 100) / 100;
  if (this.compareAtPrice) this.compareAtPrice = Math.round(this.compareAtPrice * 100) / 100;
  if (this.costPrice) this.costPrice = Math.round(this.costPrice * 100) / 100;
  next();
});

ecommerceProductSchema.index({ tenantId: 1, status: 1 });
ecommerceProductSchema.index({ tenantId: 1, category: 1 });
ecommerceProductSchema.index({ tenantId: 1, sku: 1 });
ecommerceProductSchema.index({ tenantId: 1, title: 'text', description: 'text', tags: 'text' });

export default mongoose.models.EcommerceProduct || mongoose.model('EcommerceProduct', ecommerceProductSchema);
