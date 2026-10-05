const mongoose = require('mongoose');

const MOODS = ['great', 'good', 'okay', 'low', 'rough'];

const journalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  /** Calendar day this entry belongs to (YYYY-MM-DD) */
  journalDate: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  title: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    default: '',
    maxlength: 50000,
  },
  mood: {
    type: String,
    enum: [...MOODS, ''],
    default: '',
  },
  /** Exactly 3 affirmation lines (padded/truncated on write) */
  manifestations: {
    type: [String],
    default: ['', '', ''],
    validate: {
      validator(arr) {
        return Array.isArray(arr) && arr.length <= 3;
      },
      message: 'Manifestations must be at most 3 items',
    },
  },
  tags: {
    type: [String],
    default: [],
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  /** Structure only — UI can gate later; no crypto yet */
  locked: {
    type: Boolean,
    default: false,
  },
  wordCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  /**
   * AI Reflection extension point (unused for now).
   * Future: { summary, insights, generatedAt, model }
   */
  aiReflection: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

journalSchema.index({ user: 1, journalDate: 1 }, { unique: true });
journalSchema.index({ user: 1, deletedAt: 1, journalDate: -1 });
journalSchema.index({ user: 1, favorite: 1 });

module.exports = mongoose.model('Journal', journalSchema);
module.exports.MOODS = MOODS;
