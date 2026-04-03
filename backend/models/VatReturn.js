import mongoose from 'mongoose';

const vatLineAdjustmentSchema = new mongoose.Schema({
  amount: { type: Number, default: 0 },
  adjustment: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
}, { _id: false });

const vatReturnSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  periodKey: { type: String, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true, min: 1970 },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  businessLocation: { type: String, default: 'all' },
  manual: {
    salesStandardRated: { type: vatLineAdjustmentSchema, default: () => ({}) },
    salesSpecialCitizen: { type: vatLineAdjustmentSchema, default: () => ({}) },
    salesZeroRatedDomestic: { type: vatLineAdjustmentSchema, default: () => ({}) },
    salesExports: { type: vatLineAdjustmentSchema, default: () => ({}) },
    salesExempt: { type: vatLineAdjustmentSchema, default: () => ({}) },
    purchasesStandardRatedDomestic: { type: vatLineAdjustmentSchema, default: () => ({}) },
    purchasesImportsCustoms: { type: vatLineAdjustmentSchema, default: () => ({}) },
    purchasesImportsReverseCharge: { type: vatLineAdjustmentSchema, default: () => ({}) },
    purchasesZeroRated: { type: vatLineAdjustmentSchema, default: () => ({}) },
    purchasesExempt: { type: vatLineAdjustmentSchema, default: () => ({}) },
  },
  correctionsPreviousPeriod: { type: Number, default: 0 },
  vatCreditCarriedForward: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  lastImportedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

vatReturnSchema.index({ tenantId: 1, periodKey: 1 }, { unique: true });

const VatReturn = mongoose.model('VatReturn', vatReturnSchema);
export default VatReturn;
