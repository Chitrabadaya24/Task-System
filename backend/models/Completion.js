const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
  },
  /** YYYY-MM-DD in the user's local calendar sense (client sends the key) */
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  completed: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

completionSchema.index({ habit: 1, date: 1 }, { unique: true });
completionSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Completion', completionSchema);
