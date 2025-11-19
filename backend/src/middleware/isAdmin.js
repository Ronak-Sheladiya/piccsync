const isAdmin = (req, res, next) => {
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
  
  if (!adminUserIds.includes(req.user.id)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

module.exports = isAdmin;