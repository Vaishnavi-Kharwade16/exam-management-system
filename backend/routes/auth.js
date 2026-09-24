const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name,
    year: user.year,
    section: user.section
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

  res.json({ token, user: payload });
});

// GET /api/auth/me — profile route (Student Model & Profile Route requirement).
// Returns the authenticated user's own profile, re-read from the DB (source of truth)
// rather than trusting the JWT payload alone. Used by the frontend to detect an
// incomplete student profile (missing year/section) before requesting the timetable.
router.get('/me', authenticate, (req, res) => {
  const user = db
    .prepare('SELECT id, username, email, role, name, year, section FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
