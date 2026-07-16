import mongoose from 'mongoose';

/**
 * FurnitureProduct Schema
 * Inventory for Furniture Shop.
 * Items are for sale only, with custom open pricing capabilities.
 */

const furnitureProductSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  // SKU / internal reference
  sku: { type: String, required: true, index: true },

  // Product identity
  name: { type: String, required: true },
  nameAr: { type: String },
  description: { type: String },
  descriptionAr: { type: String },

  // Categorization
  category: { type: String, index: true },        // e.g., 'Sofa', 'Carpet', 'Bed', 'Majlis'
  subCategory: { type: String },
  tags: [{ type: String }],

  // Sale fields
  salePrice: { type: Number, default: 0, min: 0 }, // 0 implies open price in POS
  costPrice: { type: Number, default: 0, min: 0 },

  // --- Physical attributes ---
  size: { type: String },
  color: { type: String },
  fabric: { type: String },
  brand: { type: String },

  // --- Media ---
  images: [{ type: String }],                       // URLs
  primaryImage: { type: String },

  // --- Stock ---
  stockQuantity: { type: Number, default: 0, min: 0 },   // For sale stock

  // --- Flags ---
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

// Compound indexes for tenant-scoped lookups
furnitureProductSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
furnitureProductSchema.index({ tenantId: 1, category: 1 });
furnitureProductSchema.index({ tenantId: 1, isActive: 1, isFeatured: 1 });

const FurnitureProduct = mongoose.model('FurnitureProduct', furnitureProductSchema);
export default FurnitureProduct;
