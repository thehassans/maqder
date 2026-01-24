import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, tenantSlug } = req.body;
    
    let tenant = null;
    if (tenantSlug) {
      tenant = await Tenant.findOne({ slug: tenantSlug, isActive: true });
      if (!tenant) {
        return res.status(400).json({ error: 'Invalid tenant' });
      }
    }
    
    const existingUser = await User.findOne({ 
      email, 
      tenantId: tenant?._id || null 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      tenantId: tenant?._id,
      role: tenant ? 'viewer' : 'admin'
    });
    
    const token = generateToken(user._id);
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;
    
    let query = { email };
    let user = null;
    
    if (tenantSlug) {
      // Login with specific tenant
      const tenant = await Tenant.findOne({ slug: tenantSlug });
      if (!tenant) {
        return res.status(401).json({ error: 'Invalid tenant code' });
      }
      if (!tenant.isActive) {
        return res.status(401).json({ error: 'Tenant account is inactive' });
      }
      query.tenantId = tenant._id;
    } else {
      // No tenant slug - first try super_admin, then find user by email
      const superAdmin = await User.findOne({ email, role: 'super_admin' }).select('+password');
      if (superAdmin) {
        user = superAdmin;
      } else {
        // Find any user with this email (tenant user)
        user = await User.findOne({ email }).select('+password').populate('tenantId');
        if (user && user.tenantId && !user.tenantId.isActive) {
          return res.status(401).json({ error: 'Tenant account is inactive' });
        }
      }
    }
    
    // If tenant slug was provided, find user with that query
    if (tenantSlug && !user) {
      user = await User.findOne(query).select('+password');
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(401).json({ error: 'Account is temporarily locked' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();
    
    const token = generateToken(user._id);
    
    // Get tenant info
    let tenant = null;
    if (user.tenantId) {
      tenant = await Tenant.findById(user.tenantId).select('name slug businessType business settings branding subscription');
    }
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        firstNameAr: user.firstNameAr,
        lastNameAr: user.lastNameAr,
        role: user.role,
        permissions: user.permissions,
        preferences: user.preferences,
        avatar: user.avatar
      },
      tenant
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let tenant = null;
    
    if (user.tenantId) {
      tenant = await Tenant.findById(user.tenantId).select('name slug businessType business settings branding subscription');
    }
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        firstNameAr: user.firstNameAr,
        lastNameAr: user.lastNameAr,
        role: user.role,
        permissions: user.permissions,
        preferences: user.preferences,
        avatar: user.avatar
      },
      tenant
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, firstNameAr, lastNameAr, phone, preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, firstNameAr, lastNameAr, phone, preferences },
      { new: true, runValidators: true }
    );
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/auth/password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
