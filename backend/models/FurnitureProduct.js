import mongoose from 'mongoose';

/**
 * FurnitureProduct Schema
 * Hybrid inventory for Furniture Shop.
 * Items can be FOR_SALE, FOR_RENT, or BOTH.
 * Each item tracks size, color, condition, and a configurable turnaround time.
 */

const rentalRateSchema = new mongoose.Schema({
  // Rental duration tier in days (e.g., 1, 3, 7)
  days: { type: Number, required: true },
  // Rate for this tier in SAR
  rate: { type: Number, required: true },
}, { _id: false });

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
  category: { type: String, index: true },        // e.g., 'Evening Dress', 'Wedding Gown'
  subCategory: { type: String },
  tags: [{ type: String }],

  // Hybrid mode: FOR_SALE | FOR_RENT | BOTH
  mode: { type: String, enum: ['FOR_SALE', 'FOR_RENT', 'BOTH'], required: true, default: 'BOTH' },

  // --- Sale fields ---
  salePrice: { type: Number, default: 0, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },

  // --- Rental fields ---
  // Tiered daily rates (e.g., 1 day = 200 SAR, 3 days = 500 SAR)
  rentalRates: { type: [rentalRateSchema], default: [] },
  // Flat daily rate fallback if no tiers matched
  dailyRate: { type: Number, default: 0, min: 0 },
  // Security deposit amount in SAR
  securityDeposit: { type: Number, default: 0, min: 0 },
  // Turnaround time in hours (cleaning, pressing, minor repairs)
  turnaroundHours: { type: Number, default: 24, min: 0 },
  // Late fee per day in SAR
  lateFeePerDay: { type: Number, default: 50, min: 0 },

  // --- Physical attributes ---
  size: { type: String },                          // e.g., 'S', 'M', 'L', 'XL', '42'
  color: { type: String },
  fabric: { type: String },
  brand: { type: String },

  // --- Rental state machine per physical item ---
  // If a product has multiple physical copies, use FurnitureInventoryUnit
  rentalStatus: {
    type: String,
    enum: ['available', 'reserved', 'rented', 'returned_pending_inspection', 'at_dry_cleaner', 'damaged', 'retired'],
    default: 'available',
    index: true
  },

  // --- Media ---
  images: [{ type: String }],                       // URLs
  primaryImage: { type: String },

  // --- Stock ---
  stockQuantity: { type: Number, default: 0, min: 0 },   // For sale stock
  rentalQuantity: { type: Number, default: 1, min: 0 }, // Number of physical copies for rent

  // --- Flags ---
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

// Compound indexes for tenant-scoped lookups
furnitureProductSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
furnitureProductSchema.index({ tenantId: 1, category: 1, rentalStatus: 1 });
furnitureProductSchema.index({ tenantId: 1, mode: 1, rentalStatus: 1 });
furnitureProductSchema.index({ tenantId: 1, isActive: 1, isFeatured: 1 });

const FurnitureProduct = mongoose.model('FurnitureProduct', furnitureProductSchema);
export default FurnitureProduct;
