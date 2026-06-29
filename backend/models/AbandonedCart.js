import mongoose from 'mongoose';

const abandonedCartSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  cartId: { type: String, required: true }, // client-generated ID
  customerEmail: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceProduct' },
    title: String,
    price: Number,
    quantity: Number,
    image: String,
  }],
  cartTotal: { type: Number, default: 0 },
  status: { type: String, enum: ['abandoned', 'recovered', 'expired'], default: 'abandoned' },
  recoveryEmailSent: { type: Boolean, default: false },
  recoveryEmailSentAt: { type: Date },
  recoveredAt: { type: Date },
  recoveredOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceOrder' },
}, { timestamps: true });

abandonedCartSchema.index({ tenantId: 1, cartId: 1 }, { unique: true });

export default mongoose.model('AbandonedCart', abandonedCartSchema);
