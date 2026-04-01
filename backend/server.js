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
import travelBookingRoutes from './routes/travelBooking.routes.js';
import restaurantMenuItemRoutes from './routes/restaurantMenuItem.routes.js';
import restaurantOrderRoutes from './routes/restaurantOrder.routes.js';

import { checkIqamaExpiry } from './jobs/iqamaChecker.js';
import { syncZatcaInvoices } from './jobs/zatcaSync.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import User from './models/User.js';

dotenv.config();

mongoose.set('bufferCommands', false);

const app = express();
const parsedApiRateLimitMax = Number(process.env.API_RATE_LIMIT_MAX || 600);
const apiRateLimitMax = Number.isFinite(parsedApiRateLimitMax) && parsedApiRateLimitMax > 0 ? parsedApiRateLimitMax : 600;
const parsedTrustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 1);
const trustProxyHops = Number.isFinite(parsedTrustProxyHops) && parsedTrustProxyHops >= 0 ? parsedTrustProxyHops : 1;
const parsedMongoServerSelectionTimeoutMs = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000);
const mongoServerSelectionTimeoutMs = Number.isFinite(parsedMongoServerSelectionTimeoutMs) && parsedMongoServerSelectionTimeoutMs > 0 ? parsedMongoServerSelectionTimeoutMs : 5000;
const parsedMongoSocketTimeoutMs = Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45000);
const mongoSocketTimeoutMs = Number.isFinite(parsedMongoSocketTimeoutMs) && parsedMongoSocketTimeoutMs > 0 ? parsedMongoSocketTimeoutMs : 45000;
const parsedMongoReconnectIntervalMs = Number(process.env.MONGODB_RECONNECT_INTERVAL_MS || 5000);
const mongoReconnectIntervalMs = Number.isFinite(parsedMongoReconnectIntervalMs) && parsedMongoReconnectIntervalMs > 0 ? parsedMongoReconnectIntervalMs : 5000;
const configuredOrigins = String(process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zatca-erp';
const databaseReadyState = () => mongoose.connection.readyState;
const isDatabaseReady = () => databaseReadyState() === 1;
let reconnectTimer = null;
let jobsStarted = false;

const seedSuperAdmin = async () => {
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
};

const startJobs = () => {
  if (jobsStarted) {
    return;
  }

  jobsStarted = true;

  cron.schedule('0 8 * * *', () => {
    logger.info('Running Iqama expiry check...');
    checkIqamaExpiry();
  });

  cron.schedule('0 */6 * * *', () => {
    logger.info('Running ZATCA B2C invoice sync...');
    syncZatcaInvoices();
  });
};

const scheduleReconnect = () => {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToDatabase();
  }, mongoReconnectIntervalMs);
};

const connectToDatabase = async () => {
  if (databaseReadyState() === 1 || databaseReadyState() === 2) {
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: mongoServerSelectionTimeoutMs,
      socketTimeoutMS: mongoSocketTimeoutMs,
    });

    logger.info('MongoDB connected successfully');
    await seedSuperAdmin();
    startJobs();
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    scheduleReconnect();
  }
};

const ensureDatabaseReady = (req, res, next) => {
  if (isDatabaseReady()) {
    return next();
  }

  return res.status(503).json({ error: 'Service temporarily unavailable. Please try again in a moment.' });
};

// Security middleware
app.set('trust proxy', trustProxyHops);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.length === 0 || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/health/live' || req.path === '/health/ready',
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: isDatabaseReady() ? 'OK' : 'DEGRADED',
    database: {
      readyState: databaseReadyState(),
      connected: isDatabaseReady(),
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/live', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health/ready', (req, res) => {
  if (!isDatabaseReady()) {
    return res.status(503).json({
      status: 'NOT_READY',
      database: {
        readyState: databaseReadyState(),
        connected: false,
      },
      timestamp: new Date().toISOString()
    });
  }

  return res.json({
    status: 'READY',
    database: {
      readyState: databaseReadyState(),
      connected: true,
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', ensureDatabaseReady, authRoutes);
app.use('/api/tenants', ensureDatabaseReady, tenantRoutes);
app.use('/api/employees', ensureDatabaseReady, employeeRoutes);
app.use('/api/payroll', ensureDatabaseReady, payrollRoutes);
app.use('/api/invoices', ensureDatabaseReady, invoiceRoutes);
app.use('/api/products', ensureDatabaseReady, productRoutes);
app.use('/api/warehouses', ensureDatabaseReady, warehouseRoutes);
app.use('/api/suppliers', ensureDatabaseReady, supplierRoutes);
app.use('/api/purchase-orders', ensureDatabaseReady, purchaseOrderRoutes);
app.use('/api/shipments', ensureDatabaseReady, shipmentRoutes);
app.use('/api/projects', ensureDatabaseReady, projectRoutes);
app.use('/api/tasks', ensureDatabaseReady, taskRoutes);
app.use('/api/iot', ensureDatabaseReady, iotRoutes);
app.use('/api/job-costing', ensureDatabaseReady, jobCostingRoutes);
app.use('/api/mrp', ensureDatabaseReady, mrpRoutes);
app.use('/api/super-admin', ensureDatabaseReady, superAdminRoutes);
app.use('/api/ai', ensureDatabaseReady, aiRoutes);
app.use('/api/dashboard', ensureDatabaseReady, dashboardRoutes);
app.use('/api/reports', ensureDatabaseReady, reportsRoutes);
app.use('/api/whatsapp', ensureDatabaseReady, whatsappRoutes);
app.use('/api/customers', ensureDatabaseReady, customerRoutes);
app.use('/api/contacts', ensureDatabaseReady, contactsRoutes);
app.use('/api/expenses', ensureDatabaseReady, expenseRoutes);
app.use('/api/users', ensureDatabaseReady, usersRoutes);
app.use('/api/travel-bookings', ensureDatabaseReady, travelBookingRoutes);
app.use('/api/restaurant/menu-items', ensureDatabaseReady, restaurantMenuItemRoutes);
app.use('/api/restaurant/orders', ensureDatabaseReady, restaurantOrderRoutes);

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
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  scheduleReconnect();
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB runtime error:', err);
});

connectToDatabase();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
