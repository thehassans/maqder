import mongoose from 'mongoose';

const EcommerceBundleSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  slug: { type: String, trim: true, index: true },

  // Products in the bundle
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceProduct', required: true },
    quantity: { type: Number, default: 1, min: 1 },
  }],

  // Pricing
  bundlePrice: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, default: 0, min: 0 }, // original total for showing savings

  // Display
  image: { type: String, default: '' },
  badgeText: { type: String, default: '' }, // e.g. "Save 20%"

  // Status
  isActive: { type: Boolean, default: true },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },

  // Analytics
  viewsCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

EcommerceBundleSchema.index({ tenantId: 1, slug: 1 });

export default mongoose.model('EcommerceBundle', EcommerceBundleSchema);
