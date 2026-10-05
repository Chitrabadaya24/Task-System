const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, trim: true, maxlength: 2000 },
  done:      { type: Boolean, default: false },
  priority:  { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate:   { type: Date },
  isToday:   { type: Boolean, default: true },
  category:  { type: String, default: 'General', trim: true, maxlength: 50 },
  important: { type: Boolean, default: false },
  type:      { type: String, enum: ['task', 'note', 'link'], default: 'task' },
  url:       { type: String, default: '', trim: true },
  location:    { type: String, default: '', trim: true, maxlength: 200 },
  meetingLink: { type: String, default: '', trim: true },
  attendees:   [{ name: String, initials: String }],
  startTime:   { type: String, default: '' },
  endTime:     { type: String, default: '' },
  scheduleId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', default: null },
  attachments: [{
    originalName: { type: String, required: true },
    filename:     { type: String, required: true },
    mimeType:     { type: String, default: '' },
    size:         { type: Number, default: 0 },
    url:          { type: String, required: true },
  }],
  subtasks: [{
    text: { type: String, trim: true, maxlength: 200 },
    done: { type: Boolean, default: false },
  }],
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

taskSchema.index({ user: 1, deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
