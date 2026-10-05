const Task = require('../models/Task');
const Schedule = require('../models/Schedule');
const { deleteUploadFiles } = require('../middleware/upload');

function normalizeAttachments(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(a => a?.url && a?.filename && a?.originalName)
    .map(a => ({
      originalName: String(a.originalName).trim(),
      filename: String(a.filename).trim(),
      mimeType: a.mimeType || '',
      size: Number(a.size) || 0,
      url: String(a.url).trim(),
    }));
}

const getTasks = async (req, res) => {
  try {
    const { trash, category, important, type, q } = req.query;
    const filter = { user: req.user._id };

    if (trash === 'true') {
      filter.deletedAt = { $ne: null };
    } else {
      filter.deletedAt = null;
    }

    if (category) filter.category = new RegExp(`^${category}$`, 'i');
    if (important === 'true') filter.important = true;
    if (type) filter.type = type;

    if (q?.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { text: regex },
        { category: regex },
        { url: regex },
        { location: regex },
        { meetingLink: regex },
        { 'attendees.name': regex },
        { 'attachments.originalName': regex },
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'TASK_FETCH_ERROR' });
  }
};

const getCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [important, meetings, trashTasks, trashEvents, todayTasks] = await Promise.all([
      Task.countDocuments({ user: userId, deletedAt: null, important: true }),
      Task.countDocuments({ user: userId, deletedAt: null, category: /^Meetings$/i }),
      Task.countDocuments({ user: userId, deletedAt: { $ne: null } }),
      Schedule.countDocuments({ user: userId, deletedAt: { $ne: null } }),
      Task.find({
        user: userId,
        deletedAt: null,
        type: { $nin: ['note', 'link'] },
        done: false,
        $or: [
          { dueDate: { $lte: end } }, // today + overdue
          { dueDate: null, isToday: { $ne: false } },
        ],
      }),
    ]);

    res.json({
      today: todayTasks.length,
      important,
      meetings,
      trash: trashTasks + trashEvents,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'TASK_COUNTS_ERROR' });
  }
};

const emptyTrash = async (req, res) => {
  try {
    const userId = req.user._id;
    const trashed = await Task.find({ user: userId, deletedAt: { $ne: null } });
    for (const task of trashed) {
      deleteUploadFiles(task.attachments);
    }
    await Promise.all([
      Task.deleteMany({ user: userId, deletedAt: { $ne: null } }),
      Schedule.deleteMany({ user: userId, deletedAt: { $ne: null } }),
    ]);
    res.json({ message: 'Trash emptied' });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'TRASH_EMPTY_ERROR' });
  }
};

const createTask = async (req, res) => {
  try {
    const { text, priority, dueDate, isToday, category, important, type, url,
      location, meetingLink, attendees, startTime, endTime, scheduleId, subtasks, attachments } = req.body;
    if (type === 'link') {
      if (!text?.trim()) return res.status(400).json({ message: 'Link title is required', code: 'VALIDATION_ERROR' });
      if (!url?.trim()) return res.status(400).json({ message: 'URL is required', code: 'VALIDATION_ERROR' });
    } else if (!text?.trim()) {
      return res.status(400).json({ message: 'Task text is required', code: 'VALIDATION_ERROR' });
    }

    const task = await Task.create({
      user: req.user._id,
      text: text.trim(),
      priority,
      dueDate: dueDate || undefined,
      isToday,
      category,
      important,
      type,
      url: url?.trim() || '',
      location: location?.trim() || '',
      meetingLink: meetingLink?.trim() || '',
      attendees: attendees || [],
      startTime: startTime?.trim() || '',
      endTime: endTime?.trim() || '',
      scheduleId: scheduleId || null,
      attachments: normalizeAttachments(attachments),
      subtasks: Array.isArray(subtasks)
        ? subtasks
            .filter(s => s?.text?.trim())
            .map(s => ({ text: s.text.trim(), done: Boolean(s.done) }))
        : [],
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'TASK_CREATE_ERROR' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found', code: 'TASK_NOT_FOUND' });

    const fields = ['text', 'done', 'priority', 'dueDate', 'isToday', 'category', 'important', 'type', 'url',
      'location', 'meetingLink', 'attendees', 'startTime', 'endTime', 'scheduleId', 'subtasks', 'deletedAt'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'subtasks' && Array.isArray(req.body.subtasks)) {
          task.subtasks = req.body.subtasks
            .filter(s => s?.text?.trim())
            .map(s => ({ text: s.text.trim(), done: Boolean(s.done) }));
        } else {
          task[f] = req.body[f];
        }
      }
    });

    if (req.body.attachments !== undefined) {
      const next = normalizeAttachments(req.body.attachments);
      const nextNames = new Set(next.map(a => a.filename));
      const removed = (task.attachments || []).filter(a => !nextNames.has(a.filename));
      deleteUploadFiles(removed);
      task.attachments = next;
    }

    if (req.body.text !== undefined && !req.body.text?.trim()) {
      return res.status(400).json({ message: 'Task text is required', code: 'VALIDATION_ERROR' });
    }
    if (req.body.text) task.text = req.body.text.trim();

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'TASK_UPDATE_ERROR' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found', code: 'TASK_NOT_FOUND' });

    if (req.query.permanent === 'true') {
      deleteUploadFiles(task.attachments);
      await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      return res.json({ message: 'Task permanently deleted' });
    }

    if (task.deletedAt) {
      return res.status(400).json({ message: 'Item is already in trash. Use permanent delete from trash.', code: 'ALREADY_IN_TRASH' });
    }

    task.deletedAt = new Date();
    await task.save();
    res.json({ message: 'Task moved to trash', task });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'TASK_DELETE_ERROR' });
  }
};

const restoreTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found', code: 'TASK_NOT_FOUND' });
    if (!task.deletedAt) return res.status(400).json({ message: 'Task is not in trash', code: 'NOT_IN_TRASH' });

    task.deletedAt = null;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'TASK_RESTORE_ERROR' });
  }
};

module.exports = { getTasks, getCounts, createTask, updateTask, deleteTask, restoreTask, emptyTrash };
