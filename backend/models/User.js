import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  email: { type: String, required: true, lowercase: true },
  password: { type: String, required: true, select: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  firstNameAr: { type: String },
  lastNameAr: { type: String },
  phone: { type: String },
  avatar: { type: String },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'accountant', 'hr_manager', 'inventory_manager', 'sales', 'viewer'],
    default: 'viewer'
  },
  permissions: [{
    module: { type: String },
    actions: [{ type: String, enum: ['create', 'read', 'update', 'delete', 'approve', 'export'] }]
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  passwordChangedAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  preferences: {
    language: { type: String, enum: ['en', 'ar'], default: 'ar' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ role: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasPermission = function(module, action) {
  if (this.role === 'super_admin' || this.role === 'admin') return true;
  const perm = this.permissions.find(p => p.module === module);
  return perm && perm.actions.includes(action);
};

const User = mongoose.model('User', userSchema);
export default User;
