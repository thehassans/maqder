import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  type: { type: String, enum: ['invoice', 'project', 'order', 'task', 'quotation', 'general'], default: 'general' },
  refId: { type: mongoose.Schema.Types.ObjectId },
  label: { type: String, default: '' }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = broadcast to tenant
  body: { type: String, required: true, maxlength: 4000 },
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, // parent message
  tags: [tagSchema],
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ tenantId: 1, fromUser: 1, createdAt: -1 });
messageSchema.index({ tenantId: 1, toUser: 1, isRead: 1, createdAt: -1 });
messageSchema.index({ thread: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
