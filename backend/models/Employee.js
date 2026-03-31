import mongoose from 'mongoose';
import momentHijri from 'moment-hijri';

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['iqama', 'passport', 'national_id', 'driving_license', 'work_permit', 'medical_insurance', 'contract', 'other'],
    required: true
  },
  number: { type: String, required: true },
  issueDate: { type: Date },
  issueDateHijri: { type: String },
  expiryDate: { type: Date },
  expiryDateHijri: { type: String },
  issuingAuthority: { type: String },
  fileUrl: { type: String },
  notes: { type: String },
  alertDays: { type: Number, default: 60 },
  isExpired: { type: Boolean, default: false },
  alertSent: { type: Boolean, default: false }
});

const bankDetailsSchema = new mongoose.Schema({
  bankName: { type: String },
  bankNameAr: { type: String },
  accountNumber: { type: String },
  iban: { type: String },
  swiftCode: { type: String }
});

const salarySchema = new mongoose.Schema({
  basicSalary: { type: Number, required: true },
  housingAllowance: { type: Number, default: 0 },
  transportAllowance: { type: Number, default: 0 },
  foodAllowance: { type: Number, default: 0 },
  otherAllowances: { type: Number, default: 0 },
  effectiveDate: { type: Date, default: Date.now }
});

const employeeSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: String, required: true },
  
  // Personal Info
  firstNameEn: { type: String, required: true },
  lastNameEn: { type: String, required: true },
  firstNameAr: { type: String },
  lastNameAr: { type: String },
  email: { type: String },
  phone: { type: String },
  alternatePhone: { type: String },
  dateOfBirth: { type: Date },
  dateOfBirthHijri: { type: String },
  gender: { type: String, enum: ['male', 'female'] },
  maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
  bloodGroup: { 
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  socialLinks: {
    facebook: { type: String },
    x: { type: String }
  },
  guardian: {
    isEnabled: { type: Boolean, default: false },
    fullName: { type: String },
    relationship: { type: String },
    phone: { type: String },
    alternatePhone: { type: String },
    email: { type: String },
    nationalId: { type: String },
    address: { type: String }
  },
  nationality: { type: String, required: true },
  religion: { type: String },
  photo: { type: String },
  idCardProof: { type: String },

  // Address
  address: {
    street: { type: String },
    city: { type: String },
    district: { type: String },
    postalCode: { type: String },
    country: { type: String, default: 'SA' }
  },

  // Employment Details
  department: { type: String },
  position: { type: String },
  positionAr: { type: String },
  employmentType: { type: String, enum: ['full_time', 'part_time', 'contract', 'probation'], default: 'full_time' },
  joinDate: { type: Date, required: true },
  joinDateHijri: { type: String },
  terminationDate: { type: Date },
  terminationDateHijri: { type: String },
  terminationReason: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  workLocation: { type: String },

  // Documents (Iqama, Passport, etc.)
  documents: [documentSchema],

  // Bank Details for WPS
  bankDetails: bankDetailsSchema,

  // Salary History
  salaryHistory: [salarySchema],
  currentSalary: salarySchema,

  // GOSI Info
  gosi: {
    subscriberNumber: { type: String },
    registrationDate: { type: Date },
    contributionPercentage: { type: Number }
  },

  // Leave Balance
  leaveBalance: {
    annual: { type: Number, default: 21 },
    sick: { type: Number, default: 30 },
    unpaid: { type: Number, default: 0 },
    used: {
      annual: { type: Number, default: 0 },
      sick: { type: Number, default: 0 },
      unpaid: { type: Number, default: 0 }
    }
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'on_leave', 'suspended', 'terminated', 'resigned'],
    default: 'active'
  },

  isActive: { type: Boolean, default: true },
  notes: { type: String }
}, {
  timestamps: true
});

employeeSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, status: 1 });
employeeSchema.index({ tenantId: 1, nationality: 1 });
employeeSchema.index({ 'documents.expiryDate': 1 });

// Virtual for full name
employeeSchema.virtual('fullNameEn').get(function() {
  return `${this.firstNameEn} ${this.lastNameEn}`;
});

employeeSchema.virtual('fullNameAr').get(function() {
  return `${this.firstNameAr || ''} ${this.lastNameAr || ''}`.trim();
});

// Virtual for total salary
employeeSchema.virtual('totalSalary').get(function() {
  if (!this.currentSalary) return 0;
  return this.currentSalary.basicSalary + 
         (this.currentSalary.housingAllowance || 0) +
         (this.currentSalary.transportAllowance || 0) +
         (this.currentSalary.foodAllowance || 0) +
         (this.currentSalary.otherAllowances || 0);
});

// Virtual for years of service
employeeSchema.virtual('yearsOfService').get(function() {
  const endDate = this.terminationDate || new Date();
  const years = (endDate - this.joinDate) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.round(years * 100) / 100;
});

// Pre-save hook to convert dates to Hijri
employeeSchema.pre('save', function(next) {
  if (this.isModified('dateOfBirth') && this.dateOfBirth) {
    this.dateOfBirthHijri = momentHijri(this.dateOfBirth).format('iYYYY/iMM/iDD');
  }
  if (this.isModified('joinDate') && this.joinDate) {
    this.joinDateHijri = momentHijri(this.joinDate).format('iYYYY/iMM/iDD');
  }
  if (this.isModified('terminationDate') && this.terminationDate) {
    this.terminationDateHijri = momentHijri(this.terminationDate).format('iYYYY/iMM/iDD');
  }
  
  // Convert document dates to Hijri
  this.documents.forEach(doc => {
    if (doc.issueDate) {
      doc.issueDateHijri = momentHijri(doc.issueDate).format('iYYYY/iMM/iDD');
    }
    if (doc.expiryDate) {
      doc.expiryDateHijri = momentHijri(doc.expiryDate).format('iYYYY/iMM/iDD');
      doc.isExpired = new Date(doc.expiryDate) < new Date();
    }
  });
  
  next();
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
