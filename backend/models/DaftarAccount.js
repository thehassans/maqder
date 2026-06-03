import mongoose from 'mongoose';

const daftarAccountSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  customerName: { type: String, required: true },
  phoneNumber: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        // Basic Saudi number validation (e.g., 05xxxxxxxx or +9665xxxxxxxx)
        return /^(05|5|\+9665)[0-9]{8}$/.test(v);
      },
      message: props => `${props.value} is not a valid Saudi phone number!`
    }
  },
  creditLimit: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DaftarTransaction' }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

daftarAccountSchema.pre('save', function(next) {
  if (this.creditLimit) this.creditLimit = Math.round(this.creditLimit * 100) / 100;
  if (this.currentBalance) this.currentBalance = Math.round(this.currentBalance * 100) / 100;
  next();
});

daftarAccountSchema.index({ tenantId: 1, phoneNumber: 1 }, { unique: true });

export default mongoose.models.DaftarAccount || mongoose.model('DaftarAccount', daftarAccountSchema);
