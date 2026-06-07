import mongoose from 'mongoose';

const rentalInvoiceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalContract', required: true, index: true },
  invoiceNumber: { type: String, required: true, unique: true },
  
  // ZATCA specific
  zatcaHash: { type: String },
  zatcaQrCodeString: { type: String }, // Base64 TLV

  // Totals
  subTotal: { type: Number, required: true, min: 0 },
  vatAmount: { type: Number, required: true, min: 0 }, // 15%
  grandTotal: { type: Number, required: true, min: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

rentalInvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });

const RentalInvoice = mongoose.model('RentalInvoice', rentalInvoiceSchema);
export default RentalInvoice;
