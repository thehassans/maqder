import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }
    
    // Check if tenant is active (for non-super admins)
    if (user.role !== 'super_admin' && user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      if (!tenant || !tenant.isActive) {
        return res.status(401).json({ error: 'Tenant account is inactive' });
      }
      if (tenant.subscription?.status !== 'active') {
        return res.status(403).json({ error: 'Subscription expired or inactive' });
      }
      req.tenant = tenant;
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

export const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      return next();
    }
    
    if (!req.user.hasPermission(module, action)) {
      return res.status(403).json({ 
        error: `Not authorized to ${action} in ${module} module` 
      });
    }
    next();
  };
};

export const tenantFilter = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    req.tenantFilter = {};
  } else {
    req.tenantFilter = { tenantId: req.user.tenantId };
  }
  next();
};

export default { protect, authorize, checkPermission, tenantFilter };
