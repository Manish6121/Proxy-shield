const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

const JWT_SECRET = 'PROXYSHIELD_JWT_SECRET_KEY_2026';

exports.login = (req, res) => {
  const { identifier, password } = req.body;
  const currentDB = db.getDB();

  const user = currentDB.users.find(u => u.identifier === identifier);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid Enrollment / Faculty ID' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, message: 'Invalid Password' });
  }

  const token = jwt.sign(
    { id: user.id, identifier: user.identifier, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, identifier: user.identifier, role: user.role, name: user.name }
  });
};

exports.verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'Access denied. Token missing.' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired JWT token.' });
  }
};
