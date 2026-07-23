/**
 * adminMiddleware — Checks if the authenticated user has ADMIN role.
 * Must be chained AFTER authMiddleware.
 * Returns 403 Forbidden if role is not ADMIN.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admins only.',
    });
  }
  next();
};

module.exports = adminMiddleware;
