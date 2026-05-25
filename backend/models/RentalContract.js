import mongoose from 'mongoose';

// Fuel level as ordered enum for comparison
export const FUEL_LEVELS = ['empty', 'quarter', 'half', 'three_quarters', 'full'];
export const FUEL_LEVEL_DISPLAY = {
  empty: { en: 'Empty', ar: 'فارغ', value: 0 },
  quarter: { en: '1/4', ar: 'ربع', value: 0.25 },
  half: { en: '1/2', ar: 'نصف', value: 0.5 },
  three_quarters: { en: '3/4', ar: 'ثلاثة أرباع', value: 0.75 },
  full: { en: 'Full', ar: 'ممتلئ', value: 1 },
};

const conditionSchema = new mongoose.Schema({
  odometer: { type: Number, required: true, min: 0 },
  fuelLevel: {
    type: String,
    enum: FUEL_LEVELS,
    required: true,
    default: 'full'
  },
  damageNotes: { type: String },
  photos: [{ type: String }], // URLs
  recordedAt: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const rentalContractSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  // Auto-generated
  contractNumber: { type: String, required: true },

  // References
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalCar', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalCustomer', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Status
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'CANCELLED'],
    default: 'OPEN',
    index: true
  },

  // Timeline
  startDateTime: { type: Date, required: true },
  expectedReturnDateTime: { type: Date, required: true },
  actualReturnDateTime: { type: Date },

  // Commercial terms (set at checkout, immutable after open)
  dailyRate: { type: Number, required: true, min: 0 },
  allowedKmPerDay: { type: Number, required: true, min: 0, default: 200 },
  perKmOverageRate: { type: Number, default: 0, min: 0 },
  hourlyLateRate: { type: Number, default: 0, min: 0 },
  securityDeposit: { type: Number, default: 0, min: 0 },

  // Conditions
  outboundCondition: conditionSchema,
  inboundCondition: conditionSchema,

  // ── Computed financials (populated at check-in) ──────────────────────────
  // Days and distances
  rentedDays: { type: Number, default: 0 },
  odometerDelta: { type: Number, default: 0 },   // totalKm driven
  allowedKmTotal: { type: Number, default: 0 },
  excessKm: { type: Number, default: 0 },

  // Charge breakdown
  baseCharge: { type: Number, default: 0 },
  extraMileageCharge: { type: Number, default: 0 },
  fuelPenalty: { type: Number, default: 0 },
  latePenalty: { type: Number, default: 0 },
  damageCharge: { type: Number, default: 0 },    // manually set at check-in
  discountAmount: { type: Number, default: 0 },
  discountReason: { type: String },

  // Totals
  subtotal: { type: Number, default: 0 },
  totalVat: { type: Number, default: 0 },         // always 15% (ZATCA)
  grandTotal: { type: Number, default: 0 },
  finalBalance: { type: Number, default: 0 },     // grandTotal - securityDeposit (negative = refund)

  // ZATCA
  vatRate: { type: Number, default: 0.15 },
  zatcaQrCode: { type: String },                  // Base64 TLMV QR

  // Extras / notes
  extraChargesNotes: { type: String },
  cancelledReason: { type: String },
}, {
  timestamps: true
});

// ── Pre-save: auto-generate contract number if new ────────────────────────────
rentalContractSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  try {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const prefix = `RC-${y}${m}${d}`;
    const last = await this.constructor.findOne(
      { tenantId: this.tenantId, contractNumber: { $regex: `^${prefix}-` } },
      { contractNumber: 1 }
    ).sort({ createdAt: -1 });
    let seq = 1;
    if (last?.contractNumber) {
      const parts = last.contractNumber.split('-');
      const n = Number(parts[parts.length - 1]);
      if (Number.isFinite(n)) seq = n + 1;
    }
    this.contractNumber = `${prefix}-${String(seq).padStart(3, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

rentalContractSchema.index({ tenantId: 1, contractNumber: 1 }, { unique: true });
rentalContractSchema.index({ tenantId: 1, status: 1 });
rentalContractSchema.index({ tenantId: 1, car: 1 });
rentalContractSchema.index({ tenantId: 1, customer: 1 });
rentalContractSchema.index({ tenantId: 1, startDateTime: -1 });
rentalContractSchema.index({ tenantId: 1, expectedReturnDateTime: 1 });

const RentalContract = mongoose.model('RentalContract', rentalContractSchema);
export default RentalContract;
