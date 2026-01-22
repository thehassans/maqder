import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zatca-erp');
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingAdmin) {
      console.log('Super Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    const superAdmin = await User.create({
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@zatca-erp.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
      firstName: 'Super',
      lastName: 'Admin',
      firstNameAr: 'المشرف',
      lastNameAr: 'العام',
      role: 'super_admin',
      isActive: true,
      preferences: {
        language: 'en',
        theme: 'light'
      }
    });

    console.log('Super Admin created successfully!');
    console.log('Email:', superAdmin.email);
    console.log('Password:', process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
