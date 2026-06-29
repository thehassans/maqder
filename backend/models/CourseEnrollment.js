import mongoose from 'mongoose';

const courseEnrollmentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookStoreProduct', required: true, index: true },
  studentName: { type: String, required: true },
  studentNameAr: { type: String },
  studentPhone: { type: String },
  studentEmail: { type: String },
  studentGrade: { type: String },
  parentName: { type: String },
  parentPhone: { type: String },
  enrollmentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['enrolled', 'completed', 'cancelled', 'waitlisted'], default: 'enrolled', index: true },
  paymentStatus: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
  amountPaid: { type: Number, default: 0 },
  notes: { type: String },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

courseEnrollmentSchema.index({ tenantId: 1, courseId: 1, studentPhone: 1 });

export default mongoose.models.CourseEnrollment || mongoose.model('CourseEnrollment', courseEnrollmentSchema);
