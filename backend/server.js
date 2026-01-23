import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import productRoutes from './routes/product.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import purchaseOrderRoutes from './routes/purchaseOrder.routes.js';
import shipmentRoutes from './routes/shipment.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import iotRoutes from './routes/iot.routes.js';
import jobCostingRoutes from './routes/jobCosting.routes.js';
import mrpRoutes from './routes/mrp.routes.js';
import superAdminRoutes from './routes/superAdmin.routes.js';
import aiRoutes from './routes/ai.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import customerRoutes from './routes/customer.routes.js';
import contactsRoutes from './routes/contacts.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import usersRoutes from './routes/users.routes.js';
import publicRoutes from './routes/public.routes.js';

import { checkIqamaExpiry } from './jobs/iqamaChecker.js';
import { syncZatcaInvoices } from './jobs/zatcaSync.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import User from './models/User.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/job-costing', jobCostingRoutes);
app.use('/api/mrp', mrpRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static frontend files in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zatca-erp')
  .then(async () => {
    logger.info('MongoDB connected successfully');
    
    // Auto-seed super admin if not exists
    try {
      const existingAdmin = await User.findOne({ role: 'super_admin' });
      if (!existingAdmin) {
        await User.create({
          email: process.env.SUPER_ADMIN_EMAIL || 'admin@maqder.com',
          password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
          firstName: 'Super',
          lastName: 'Admin',
          firstNameAr: 'المشرف',
          lastNameAr: 'العام',
          role: 'super_admin',
          isActive: true,
          preferences: { language: 'en', theme: 'light' }
        });
        logger.info('Super Admin created: ' + (process.env.SUPER_ADMIN_EMAIL || 'admin@maqder.com'));
      }
    } catch (err) {
      logger.error('Auto-seed super admin error:', err.message);
    }
    
    // Cron Jobs
    // Check Iqama expiry daily at 8 AM
    cron.schedule('0 8 * * *', () => {
      logger.info('Running Iqama expiry check...');
      checkIqamaExpiry();
    });
    
    // Sync B2C invoices to ZATCA every 6 hours
    cron.schedule('0 */6 * * *', () => {
      logger.info('Running ZATCA B2C invoice sync...');
      syncZatcaInvoices();
    });
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
