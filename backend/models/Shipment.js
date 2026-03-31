import mongoose from 'mongoose';

const shipmentLineItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  description: { type: String },
  quantity: { type: Number, required: true, min: 0 }
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  shipmentNumber: { type: String, required: true },
  type: { type: String, enum: ['inbound', 'outbound'], default: 'inbound' },
  status: { type: String, enum: ['draft', 'in_transit', 'delivered', 'cancelled'], default: 'draft' },

  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

  carrier: { type: String },
  trackingNumber: { type: String },

  shippedAt: { type: Date },
  expectedDelivery: { type: Date },
  deliveredAt: { type: Date },

  lineItems: { type: [shipmentLineItemSchema], default: [] },

  notes: { type: String },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

shipmentSchema.index({ tenantId: 1, shipmentNumber: 1 }, { unique: true });
shipmentSchema.index({ tenantId: 1, status: 1 });
shipmentSchema.index({ tenantId: 1, shippedAt: -1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;
