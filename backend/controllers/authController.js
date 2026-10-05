const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please provide name, email and password', code: 'VALIDATION_ERROR' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Please provide a valid email', code: 'VALIDATION_ERROR' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters', code: 'VALIDATION_ERROR' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Please provide email and password' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ message: 'Name is required', code: 'VALIDATION_ERROR' });
      user.name = trimmed;
    }

    if (email !== undefined) {
      const nextEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail))
        return res.status(400).json({ message: 'Please provide a valid email', code: 'VALIDATION_ERROR' });
      if (nextEmail !== user.email) {
        const exists = await User.findOne({ email: nextEmail });
        if (exists) return res.status(400).json({ message: 'Email already registered' });
        user.email = nextEmail;
      }
    }

    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ message: 'Current password is required to set a new password', code: 'VALIDATION_ERROR' });
      if (newPassword.length < 6)
        return res.status(400).json({ message: 'Password must be at least 6 characters', code: 'VALIDATION_ERROR' });
      if (!(await user.matchPassword(currentPassword)))
        return res.status(401).json({ message: 'Current password is incorrect' });
      user.password = newPassword;
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
