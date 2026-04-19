import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const parsedDatabaseQueryTimeoutMs = Number(process.env.MONGODB_QUERY_TIMEOUT_MS || 10000);
const databaseQueryTimeoutMs = Number.isFinite(parsedDatabaseQueryTimeoutMs) && parsedDatabaseQueryTimeoutMs > 0 ? parsedDatabaseQueryTimeoutMs : 10000;

const withQueryTimeout = (query) => query.maxTimeMS(databaseQueryTimeoutMs);

const isDatabaseAvailabilityError = (error) => {
  const message = String(error?.message || '').toLowerCase();

  return message.includes('buffering timed out')
    || message.includes('timed out after')
    || message.includes('server selection')
    || message.includes('ecconnrefused')
    || message.includes('not connected')
    || message.includes('initial connection')
    || message.includes('topology is closed')
    || message.includes('client must be connected');
};

const sendRouteError = (res, error) => {
  if (isDatabaseAvailabilityError(error)) {
    return res.status(503).json({ error: 'Authentication service is temporarily unavailable. Please try again in a moment.' });
  }

  return res.status(500).json({ error: error.message });
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const authTenantSelect = 'name slug businessType businessTypes business settings branding subscription isActive';

const serializeAuthTenant = (tenant) => {
  if (!tenant) return null;

  const source = typeof tenant.toObject === 'function' ? tenant.toObject() : tenant;

  return {
    _id: source._id,
    name: source.name,
    slug: source.slug,
    businessType: source.businessType,
    businessTypes: source.businessTypes,
    business: source.business,
    settings: source.settings,
    branding: source.branding,
    subscription: source.subscription,
  };
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, tenantSlug } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const normalizedTenantSlug = String(tenantSlug || '').trim().toLowerCase();
    
    let tenant = null;
    if (normalizedTenantSlug) {
      tenant = await withQueryTimeout(Tenant.findOne({ slug: normalizedTenantSlug, isActive: true }));
      if (!tenant) {
        return res.status(400).json({ error: 'Invalid tenant' });
      }
    }
    
    const existingUser = await withQueryTimeout(User.findOne({ 
      email: normalizedEmail, 
      tenantId: tenant?._id || null 
    }));
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = await User.create({
      email: normalizedEmail,
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
    sendRouteError(res, error);
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const normalizedTenantSlug = String(tenantSlug || '').trim().toLowerCase();
    
    let query = { email: normalizedEmail };
    let user = null;
    let tenant = null;
    let passwordAlreadyVerified = false;
    
    if (normalizedTenantSlug) {
      // Login with specific tenant
      tenant = await withQueryTimeout(Tenant.findOne({ slug: normalizedTenantSlug }).select(authTenantSelect));
      if (!tenant) {
        return res.status(401).json({ error: 'Invalid tenant code' });
      }
      if (!tenant.isActive) {
        return res.status(401).json({ error: 'Tenant account is inactive' });
      }
      query.tenantId = tenant._id;
    } else {
      const matchingUsers = await withQueryTimeout(User.find({ email: normalizedEmail }).select('+password'));

      if (matchingUsers.length === 1) {
        user = matchingUsers[0];
      } else if (matchingUsers.length > 1) {
        const passwordMatches = (
          await Promise.all(
            matchingUsers.map(async (candidate) => ({
              candidate,
              isMatch: await candidate.comparePassword(password),
            }))
          )
        )
          .filter(({ isMatch }) => isMatch)
          .map(({ candidate }) => candidate);

        if (passwordMatches.length === 1) {
          user = passwordMatches[0];
          passwordAlreadyVerified = true;
        } else if (passwordMatches.length > 1) {
          const preferredMatch = passwordMatches.find((candidate) => candidate.role === 'super_admin')
            || passwordMatches.find((candidate) => !candidate.tenantId);

          if (!preferredMatch) {
            return res.status(401).json({ error: 'Unable to determine the correct account for this email' });
          }

          user = preferredMatch;
          passwordAlreadyVerified = true;
        } else {
          const superAdmin = matchingUsers.find((candidate) => candidate.role === 'super_admin');
          const globalUser = matchingUsers.find((candidate) => !candidate.tenantId);

          user = superAdmin || globalUser || null;
        }
      }
    }
    
    // If tenant slug was provided, find user with that query
    if (normalizedTenantSlug && !user) {
      user = await withQueryTimeout(User.findOne(query).select('+password'));
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    if (user.tenantId) {
      tenant = tenant || await withQueryTimeout(Tenant.findById(user.tenantId).select(authTenantSelect));
      if (!tenant || !tenant.isActive) {
        return res.status(401).json({ error: 'Tenant account is inactive' });
      }
    }

    // If a previous lock has expired, clear it so the user isn't immediately re-locked
    const now = Date.now();
    const hadExpiredLock = Boolean(user.lockUntil && user.lockUntil <= now);

    if (hadExpiredLock) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }
    
    if (user.lockUntil && user.lockUntil > now) {
      return res.status(401).json({ error: 'Account is temporarily locked' });
    }
    
    const isMatch = passwordAlreadyVerified ? true : await user.comparePassword(password);
    
    if (!isMatch) {
      const failedLoginAttempts = (user.loginAttempts || 0) + 1;
      const failedUpdate = {
        $set: {
          loginAttempts: failedLoginAttempts,
        },
      };

      if (failedLoginAttempts >= 5) {
        failedUpdate.$set.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      } else if (hadExpiredLock) {
        failedUpdate.$unset = { lockUntil: 1 };
      }

      await withQueryTimeout(User.updateOne({ _id: user._id }, failedUpdate));
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Reset login attempts on successful login
    await withQueryTimeout(User.updateOne(
      { _id: user._id },
      {
        $set: { loginAttempts: 0, lastLogin: new Date() },
        $unset: { lockUntil: 1 },
      }
    ));
    
    const token = generateToken(user._id);
    const responseTenant = serializeAuthTenant(tenant);
    
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
      tenant: responseTenant
    });
  } catch (error) {
    sendRouteError(res, error);
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const [user, tenantDoc] = await Promise.all([
      withQueryTimeout(User.findById(req.user._id).lean()),
      req.user?.tenantId
        ? withQueryTimeout(Tenant.findById(req.user.tenantId).select(authTenantSelect))
        : Promise.resolve(null),
    ]);

    if (!user) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const tenant = tenantDoc ? serializeAuthTenant(tenantDoc) : null;
    
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
    sendRouteError(res, error);
  }
});

// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, firstNameAr, lastNameAr, phone, preferences } = req.body;
    
    const user = await withQueryTimeout(User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, firstNameAr, lastNameAr, phone, preferences },
      { new: true, runValidators: true }
    ));
    
    res.json({ user });
  } catch (error) {
    sendRouteError(res, error);
  }
});

// @route   PUT /api/auth/password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await withQueryTimeout(User.findById(req.user._id).select('+password'));
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    sendRouteError(res, error);
  }
});

export default router;
