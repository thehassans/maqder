import mongoose from 'mongoose';

const leadQuerySchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, trim: true, index: true },
  name: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['new', 'attended', 'interested', 'not_interested', 'converted', 'follow_up'],
    default: 'new',
  },
  serviceInterest: {
    type: String,
    enum: ['hardware', 'software', 'both', 'none'],
    default: 'none',
  },
  tenantType: { type: String, default: '' },
  city: { type: String, default: '' },
  notes: { type: String, default: '' },
  noteHistory: [{
    note: String,
    date: { type: Date, default: Date.now },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('LeadQuery', leadQuerySchema);
