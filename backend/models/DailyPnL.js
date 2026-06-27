import mongoose from 'mongoose';

const cashMovementSchema = new mongoose.Schema({
  type: { type: String, enum: ['in', 'out'], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    enum: ['rent', 'utilities', 'salaries', 'supplier_payment', 'maintenance', 'transport', 'misc_expense', 'owner_draw', 'capital_injection', 'loan_repayment', 'other'],
    required: true,
  },
  description: { type: String },
  reference: { type: String }, // PO number, invoice number, etc.
  paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'card', 'cheque'], default: 'cash' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordedAt: { type: Date, default: Date.now },
}, { _id: true, timestamps: true });

const dailyPnLSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  date: { type: Date, required: true },

  // Sales (from invoices)
  totalSales: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  cashSales: { type: Number, default: 0 },
  cardSales: { type: Number, default: 0 },
  khataSales: { type: Number, default: 0 },
  splitSales: { type: Number, default: 0 },
  salesReturns: { type: Number, default: 0 },

  // Cost of goods sold (from product cost prices)
  cogs: { type: Number, default: 0 },

  // Gross profit
  grossProfit: { type: Number, default: 0 },

  // Operating expenses (manual cash movements)
  totalExpenses: { type: Number, default: 0 },
  expensesByCategory: {
    rent: { type: Number, default: 0 },
    utilities: { type: Number, default: 0 },
    salaries: { type: Number, default: 0 },
    supplier_payment: { type: Number, default: 0 },
    maintenance: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    misc_expense: { type: Number, default: 0 },
    owner_draw: { type: Number, default: 0 },
    capital_injection: { type: Number, default: 0 },
    loan_repayment: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },

  // Net profit
  netProfit: { type: Number, default: 0 },

  // Cash position
  cashIn: { type: Number, default: 0 },
  cashOut: { type: Number, default: 0 },
  netCashFlow: { type: Number, default: 0 },

  // Cash movements (detailed)
  cashMovements: [cashMovementSchema],

  notes: { type: String },
}, { timestamps: true });

dailyPnLSchema.index({ tenantId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyPnL || mongoose.model('DailyPnL', dailyPnLSchema);
