import mongoose from 'mongoose';

const bookRentalSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookStoreProduct', required: true },
  productName: { type: String, required: true },
  productIsbn: { type: String },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerNameAr: { type: String },
  rentDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date, default: null },
  rentalFee: { type: Number, default: 0 },
  depositAmount: { type: Number, default: 0 },
  depositRefunded: { type: Boolean, default: false },
  lateFee: { type: Number, default: 0 },
  lateFeePerDay: { type: Number, default: 5 },
  totalCharge: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'returned', 'overdue', 'lost'], default: 'active', index: true },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

bookRentalSchema.index({ tenantId: 1, status: 1, dueDate: 1 });

export default mongoose.models.BookRental || mongoose.model('BookRental', bookRentalSchema);
