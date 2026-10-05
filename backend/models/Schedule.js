const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true, trim: true },
  startTime: { type: String, default: '' },
  endTime:   { type: String, default: '' },
  date:      { type: Date, default: Date.now },
  color:     { type: String, enum: ['yellow', 'blue', 'pink', 'green'], default: 'blue' },
  members:   [{ name: String, initials: String }],
  taskId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

scheduleSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
