const jwt = require('jsonwebtoken');

function adminAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No admin token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }

    req.adminId = decoded.adminId;
    req.adminRole = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid admin token' });
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    // Super admin has all permissions
    if (req.adminRole === 'super_admin') {
      return next();
    }
    
    // Check if admin has specific permission
    if (req.adminPermissions && req.adminPermissions.includes(permission)) {
      return next();
    }

    res.status(403).json({ success: false, message: 'Insufficient permissions' });
  };
}

module.exports = { adminAuth, requirePermission };
