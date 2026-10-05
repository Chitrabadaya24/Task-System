const Schedule = require('../models/Schedule');

const getSchedules = async (req, res) => {
  try {
    const filter = { user: req.user._id };

    if (req.query.trash === 'true') {
      filter.deletedAt = { $ne: null };
    } else {
      filter.deletedAt = null;
    }

    if (req.query.date) {
      const [y, m, d] = req.query.date.split('-').map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const schedules = await Schedule.find(filter).sort({ date: 1, startTime: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'SCHEDULE_FETCH_ERROR' });
  }
};

const createSchedule = async (req, res) => {
  try {
    const { title, startTime, endTime, date, color, members, taskId } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required', code: 'VALIDATION_ERROR' });
    }
    const schedule = await Schedule.create({
      user: req.user._id,
      title: title.trim(),
      startTime: startTime?.trim() || '',
      endTime: endTime?.trim() || '',
      date: date || new Date(),
      color,
      members,
      taskId: taskId || null,
    });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'SCHEDULE_CREATE_ERROR' });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found', code: 'SCHEDULE_NOT_FOUND' });

    const fields = ['title', 'startTime', 'endTime', 'date', 'color', 'members', 'taskId', 'deletedAt'];
    fields.forEach(f => { if (req.body[f] !== undefined) schedule[f] = req.body[f]; });
    if (req.body.title) schedule.title = req.body.title.trim();

    await schedule.save();
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'SCHEDULE_UPDATE_ERROR' });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found', code: 'SCHEDULE_NOT_FOUND' });

    if (req.query.permanent === 'true') {
      await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      return res.json({ message: 'Event permanently deleted' });
    }

    schedule.deletedAt = new Date();
    await schedule.save();
    res.json({ message: 'Event moved to trash', schedule });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'SCHEDULE_DELETE_ERROR' });
  }
};

const restoreSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found', code: 'SCHEDULE_NOT_FOUND' });
    if (!schedule.deletedAt) return res.status(400).json({ message: 'Event is not in trash', code: 'NOT_IN_TRASH' });

    schedule.deletedAt = null;
    await schedule.save();
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'SCHEDULE_RESTORE_ERROR' });
  }
};

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule, restoreSchedule };
