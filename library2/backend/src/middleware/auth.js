const jwt = require('jsonwebtoken');

// Verify JWT token on every protected route
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // Backward compatibility for old employee-only handlers.
    if (decoded.userType === 'employee' || decoded.role) {
      req.employee = decoded;
    }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role guard — pass allowed roles as array e.g. ['Admin', 'Librarian']
const requireRole = (...roles) => (req, res, next) => {
  if (req.user?.userType === 'member') {
    return res.status(403).json({ message: 'Employee role required for this action' });
  }
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: `Access restricted to: ${roles.join(', ')}` });
  }
  next();
};

const requireUserType = (...types) => (req, res, next) => {
  if (!types.includes(req.user?.userType || 'employee')) {
    return res.status(403).json({ message: `Access restricted to account type: ${types.join(', ')}` });
  }
  next();
};

module.exports = { verifyToken, requireRole, requireUserType };
