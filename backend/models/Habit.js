const mongoose = require('mongoose');

const HABIT_CATEGORIES = [
  'Health',
  'Fitness',
  'Learning',
  'Finance',
  'Productivity',
  'Reading',
  'Meditation',
  'Custom',
];

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },
  icon: {
    type: String,
    default: '🔥',
    trim: true,
    maxlength: 16,
  },
  color: {
    type: String,
    default: '#6c47ff',
    trim: true,
    maxlength: 20,
  },
  category: {
    type: String,
    default: 'Health',
    trim: true,
    maxlength: 50,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily',
  },
  /** HH:mm local time for reminder prep (stored; client can surface later) */
  reminderTime: {
    type: String,
    default: '',
    trim: true,
    maxlength: 5,
  },
  /** 0=Sun … 6=Sat — days the habit applies (weekly or daily subset) */
  targetDays: {
    type: [Number],
    default: [0, 1, 2, 3, 4, 5, 6],
  },
  streak: {
    type: Number,
    default: 0,
    min: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

habitSchema.index({ user: 1, deletedAt: 1, createdAt: -1 });
habitSchema.index({ user: 1, isArchived: 1, isPaused: 1 });

module.exports = mongoose.model('Habit', habitSchema);
module.exports.HABIT_CATEGORIES = HABIT_CATEGORIES;
