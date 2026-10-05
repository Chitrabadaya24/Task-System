const Habit = require('../models/Habit');
const Completion = require('../models/Completion');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateKey(key) {
  if (!DATE_RE.test(key || '')) return null;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date) {
  const x = date instanceof Date ? date : new Date(date);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const d = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(key, n) {
  const d = parseDateKey(key);
  if (!d) return null;
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

function dayOfWeek(key) {
  const d = parseDateKey(key);
  return d ? d.getDay() : null;
}

/** Whether habit is scheduled on a given date key */
function isScheduledOn(habit, dateKey) {
  const dow = dayOfWeek(dateKey);
  if (dow == null) return false;
  const days = Array.isArray(habit.targetDays) && habit.targetDays.length
    ? habit.targetDays
    : [0, 1, 2, 3, 4, 5, 6];
  return days.includes(dow);
}

/**
 * Recalculate current + longest streak from completion history.
 * Counts consecutive scheduled days ending at `asOf` (or yesterday if today missed).
 */
function computeStreaks(habit, completedSet, asOf) {
  const today = asOf || toDateKey(new Date());
  let streak = 0;
  let cursor = today;

  // If today is scheduled and not done, streak continues from yesterday
  if (isScheduledOn(habit, today) && !completedSet.has(today)) {
    cursor = addDays(today, -1);
  }

  while (cursor) {
    if (!isScheduledOn(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!completedSet.has(cursor)) break;
    streak += 1;
    cursor = addDays(cursor, -1);
    // Safety: don't walk forever
    if (streak > 3650) break;
  }

  // Longest: scan all completed scheduled days
  const sorted = [...completedSet].filter(k => isScheduledOn(habit, k)).sort();
  let longest = habit.longestStreak || 0;
  let run = 0;
  let prev = null;
  for (const key of sorted) {
    if (!prev) {
      run = 1;
    } else {
      // Walk from prev+1 to key; only count if all in-between scheduled days are also complete
      let ok = true;
      let walk = addDays(prev, 1);
      while (walk && walk < key) {
        if (isScheduledOn(habit, walk) && !completedSet.has(walk)) {
          ok = false;
          break;
        }
        walk = addDays(walk, 1);
      }
      run = ok ? run + 1 : 1;
    }
    if (run > longest) longest = run;
    prev = key;
  }
  if (streak > longest) longest = streak;

  return { streak, longestStreak: longest };
}

function attachStats(habitDoc, completions) {
  const habit = habitDoc.toObject ? habitDoc.toObject() : { ...habitDoc };
  const history = {};
  const completedSet = new Set();
  for (const c of completions) {
    history[c.date] = Boolean(c.completed);
    if (c.completed) completedSet.add(c.date);
  }
  const totalDone = completedSet.size;
  const createdKey = toDateKey(habit.createdAt || new Date());
  let scheduledDays = 0;
  let cursor = createdKey;
  const today = toDateKey(new Date());
  while (cursor && cursor <= today) {
    if (isScheduledOn(habit, cursor)) scheduledDays += 1;
    cursor = addDays(cursor, 1);
    if (scheduledDays > 3660) break;
  }
  const completionPercentage = scheduledDays > 0
    ? Math.round((totalDone / scheduledDays) * 100)
    : 0;

  return {
    ...habit,
    completionHistory: history,
    completionPercentage: Math.min(100, completionPercentage),
    totalCompletions: totalDone,
  };
}

async function loadHabitsWithStats(filter) {
  const habits = await Habit.find(filter).sort({ createdAt: -1 });
  if (!habits.length) return [];
  const ids = habits.map(h => h._id);
  const completions = await Completion.find({
    habit: { $in: ids },
    completed: true,
  }).select('habit date completed');

  const byHabit = {};
  for (const c of completions) {
    const key = String(c.habit);
    if (!byHabit[key]) byHabit[key] = [];
    byHabit[key].push(c);
  }

  return habits.map(h => attachStats(h, byHabit[String(h._id)] || []));
}

// ── Controllers ──────────────────────────────────────────────

const getHabits = async (req, res) => {
  try {
    const filter = { user: req.user._id, deletedAt: null };

    if (req.query.archived === 'true') {
      filter.isArchived = true;
    } else if (req.query.archived === 'false') {
      filter.isArchived = false;
    }

    if (req.query.paused === 'true') filter.isPaused = true;
    if (req.query.paused === 'false') filter.isPaused = false;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.q?.trim()) {
      const q = req.query.q.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }

    const habits = await loadHabitsWithStats(filter);
    res.json(habits);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'HABIT_FETCH_ERROR' });
  }
};

const getHabitCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = toDateKey(new Date());
    const active = await Habit.find({
      user: userId,
      deletedAt: null,
      isArchived: false,
      isPaused: false,
    });

    let dueToday = 0;
    let completedToday = 0;
    const activeIds = active.map(h => h._id);
    const todayCompletions = activeIds.length
      ? await Completion.find({
          habit: { $in: activeIds },
          date: today,
          completed: true,
        })
      : [];
    const doneSet = new Set(todayCompletions.map(c => String(c.habit)));

    for (const h of active) {
      if (!isScheduledOn(h, today)) continue;
      dueToday += 1;
      if (doneSet.has(String(h._id))) completedToday += 1;
    }

    const pendingToday = Math.max(0, dueToday - completedToday);
    const bestStreak = active.reduce((m, h) => Math.max(m, h.streak || 0), 0);

    res.json({
      habits: active.length,
      dueToday,
      completedToday,
      pendingToday,
      bestStreak,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'HABIT_COUNTS_ERROR' });
  }
};

const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const habits = await loadHabitsWithStats({
      user: userId,
      deletedAt: null,
      isArchived: false,
    });

    const today = toDateKey(new Date());
    const weekStart = (() => {
      const d = parseDateKey(today);
      const day = d.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + mondayOffset);
      return toDateKey(d);
    })();

    const monthPrefix = today.slice(0, 7);

    let totalCompleted = 0;
    let weeklyCompleted = 0;
    let monthlyCompleted = 0;
    let streakSum = 0;
    let activeDaysSet = new Set();
    let bestHabit = null;
    let weakestHabit = null;

    const weeklyTrend = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (const h of habits) {
      if (h.isPaused) continue;
      streakSum += h.streak || 0;
      const hist = h.completionHistory || {};
      const keys = Object.keys(hist).filter(k => hist[k]);
      totalCompleted += keys.length;

      for (const k of keys) {
        activeDaysSet.add(k);
        if (k >= weekStart && k <= today) {
          weeklyCompleted += 1;
          const dow = dayOfWeek(k);
          if (dow != null) weeklyTrend[dayLabels[dow]] += 1;
        }
        if (k.startsWith(monthPrefix)) monthlyCompleted += 1;
      }

      const pct = h.completionPercentage || 0;
      if (!bestHabit || pct > bestHabit.completionPercentage) {
        bestHabit = { _id: h._id, title: h.title, icon: h.icon, completionPercentage: pct };
      }
      if (!weakestHabit || pct < weakestHabit.completionPercentage) {
        weakestHabit = { _id: h._id, title: h.title, icon: h.icon, completionPercentage: pct };
      }
    }

    const tracked = habits.filter(h => !h.isPaused);
    const successRate = tracked.length
      ? Math.round(tracked.reduce((s, h) => s + (h.completionPercentage || 0), 0) / tracked.length)
      : 0;
    const averageStreak = tracked.length
      ? Math.round((streakSum / tracked.length) * 10) / 10
      : 0;

    // Current / longest across all
    const currentStreak = tracked.reduce((m, h) => Math.max(m, h.streak || 0), 0);
    const longestStreak = tracked.reduce((m, h) => Math.max(m, h.longestStreak || 0), 0);

    const dueToday = tracked.filter(h => isScheduledOn(h, today));
    const completedToday = dueToday.filter(h => h.completionHistory?.[today]).length;
    const completionTodayPct = dueToday.length
      ? Math.round((completedToday / dueToday.length) * 100)
      : 0;

    res.json({
      totalHabits: tracked.length,
      completedToday,
      dueToday: dueToday.length,
      currentStreak,
      longestStreak,
      completionPercentage: completionTodayPct,
      weeklyCompleted,
      monthlyCompleted,
      totalCompleted,
      successRate,
      bestHabit,
      weakestHabit,
      averageStreak,
      totalActiveDays: activeDaysSet.size,
      weeklyTrend,
      motivational: motivationalMessage(completionTodayPct, completedToday, dueToday.length),
    });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'HABIT_STATS_ERROR' });
  }
};

function motivationalMessage(pct, done, total) {
  if (total === 0) return 'Create your first habit and start building momentum.';
  if (pct === 100) return 'Perfect day! Every habit checked — you are unstoppable.';
  if (pct >= 75) return 'Excellent pace. Finish strong and lock in today\'s streak.';
  if (pct >= 50) return 'Halfway there. A few more wins will keep your streak alive.';
  if (done > 0) return 'Good start — keep going, future you will thank you.';
  return 'A fresh day awaits. Complete one habit to spark the chain.';
}

const createHabit = async (req, res) => {
  try {
    const {
      title, description, icon, color, category, frequency,
      reminderTime, targetDays,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required', code: 'VALIDATION_ERROR' });
    }

    let days = Array.isArray(targetDays) ? targetDays.map(Number).filter(n => n >= 0 && n <= 6) : null;
    if (!days || !days.length) {
      days = frequency === 'weekly' ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
    }

    const habit = await Habit.create({
      user: req.user._id,
      title: title.trim(),
      description: (description || '').trim(),
      icon: (icon || '🔥').trim().slice(0, 16),
      color: color || '#6c47ff',
      category: (category || 'Health').trim().slice(0, 50),
      frequency: frequency === 'weekly' ? 'weekly' : 'daily',
      reminderTime: (reminderTime || '').trim().slice(0, 5),
      targetDays: days,
    });

    res.status(201).json(attachStats(habit, []));
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'HABIT_CREATE_ERROR' });
  }
};

const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }

    const fields = [
      'title', 'description', 'icon', 'color', 'category', 'frequency',
      'reminderTime', 'targetDays', 'isArchived', 'isPaused',
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined) habit[f] = req.body[f];
    });
    if (req.body.title) habit.title = req.body.title.trim();
    if (req.body.description !== undefined) habit.description = String(req.body.description).trim();

    await habit.save();
    const completions = await Completion.find({ habit: habit._id, completed: true });
    res.json(attachStats(habit, completions));
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'HABIT_UPDATE_ERROR' });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }

    if (req.query.permanent === 'true') {
      await Completion.deleteMany({ habit: habit._id });
      await Habit.deleteOne({ _id: habit._id });
      return res.json({ message: 'Habit permanently deleted' });
    }

    habit.deletedAt = new Date();
    await habit.save();
    res.json({ message: 'Habit deleted', habit });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'HABIT_DELETE_ERROR' });
  }
};

const archiveHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    habit.isArchived = req.body.isArchived !== undefined ? Boolean(req.body.isArchived) : true;
    await habit.save();
    const completions = await Completion.find({ habit: habit._id, completed: true });
    res.json(attachStats(habit, completions));
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'HABIT_ARCHIVE_ERROR' });
  }
};

const pauseHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    habit.isPaused = req.body.isPaused !== undefined
      ? Boolean(req.body.isPaused)
      : !habit.isPaused;
    await habit.save();
    const completions = await Completion.find({ habit: habit._id, completed: true });
    res.json(attachStats(habit, completions));
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'HABIT_PAUSE_ERROR' });
  }
};

/** Toggle completion for a date (defaults to today). Recalculates streaks. */
const toggleCompletion = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    if (habit.isPaused) {
      return res.status(400).json({ message: 'Habit is paused', code: 'HABIT_PAUSED' });
    }
    if (habit.isArchived) {
      return res.status(400).json({ message: 'Habit is archived', code: 'HABIT_ARCHIVED' });
    }

    const date = DATE_RE.test(req.body.date) ? req.body.date : toDateKey(new Date());
    let completion = await Completion.findOne({ habit: habit._id, date });

    let completed;
    if (req.body.completed !== undefined) {
      completed = Boolean(req.body.completed);
    } else if (completion) {
      completed = !completion.completed;
    } else {
      completed = true;
    }

    if (completion) {
      completion.completed = completed;
      await completion.save();
    } else {
      completion = await Completion.create({
        user: req.user._id,
        habit: habit._id,
        date,
        completed,
      });
    }

    if (!completed) {
      await Completion.deleteOne({ _id: completion._id });
    }

    const all = await Completion.find({ habit: habit._id, completed: true });
    const set = new Set(all.map(c => c.date));
    const { streak, longestStreak } = computeStreaks(habit, set, toDateKey(new Date()));
    habit.streak = streak;
    habit.longestStreak = Math.max(habit.longestStreak || 0, longestStreak);
    await habit.save();

    res.json({
      habit: attachStats(habit, all),
      date,
      completed: Boolean(completed),
    });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'HABIT_TOGGLE_ERROR' });
  }
};

const getCompletions = async (req, res) => {
  try {
    const filter = { user: req.user._id, completed: true };
    if (req.query.habitId) filter.habit = req.query.habitId;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to) filter.date.$lte = req.query.to;
    }
    const list = await Completion.find(filter).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'COMPLETION_FETCH_ERROR' });
  }
};

module.exports = {
  getHabits,
  getHabitCounts,
  getStats,
  createHabit,
  updateHabit,
  deleteHabit,
  archiveHabit,
  pauseHabit,
  toggleCompletion,
  getCompletions,
  // helpers exported for tests if needed
  computeStreaks,
  toDateKey,
};
