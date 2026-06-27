import mongoose from 'mongoose';

const alterationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoutiqueRental' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoutiqueProduct' },
  productName: { type: String },
  sku: { type: String },

  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },

  alterationType: {
    type: String,
    enum: ['hem', 'take_in', 'let_out', 'strap_adjust', 'bust_adjust', 'length_adjust', 'beading', 'custom', 'other'],
    required: true,
  },

  description: { type: String, required: true },

  // Measurements (cm)
  measurements: {
    bust: { type: Number },
    waist: { type: Number },
    hips: { type: Number },
    length: { type: Number },
    shoulder: { type: Number },
    sleeveLength: { type: Number },
    inseam: { type: Number },
    notes: { type: String },
  },

  assignedTo: { type: String }, // Tailor/staff name
  cost: { type: Number, default: 0 },
  chargeToCustomer: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['requested', 'in_progress', 'completed', 'cancelled'],
    default: 'requested',
  },

  requestedDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  completedAt: { type: Date },

  // Damage tracking
  damageReported: { type: Boolean, default: false },
  damageDescription: { type: String },
  damageFee: { type: Number, default: 0 },

  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

alterationSchema.index({ tenantId: 1, status: 1, dueDate: 1 });
alterationSchema.index({ tenantId: 1, customerPhone: 1 });
alterationSchema.index({ tenantId: 1, rentalId: 1 });

export default mongoose.models.BoutiqueAlteration || mongoose.model('BoutiqueAlteration', alterationSchema);
