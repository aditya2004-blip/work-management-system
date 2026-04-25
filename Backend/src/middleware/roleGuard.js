// Middleware to restrict access based on user roles
const roleGuard = (...roles) => (req, res, next) => {

  // Check if user's role is allowed
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }

  return next(); // Access granted
};

export { roleGuard };