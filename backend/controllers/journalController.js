const Journal = require('../models/Journal');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MOODS = ['great', 'good', 'okay', 'low', 'rough'];

function toDateKey(date = new Date()) {
  const x = date instanceof Date ? date : new Date(date);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const d = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return toDateKey(dt);
}

function countWords(text = '') {
  const t = String(text).trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function normalizeManifestations(input) {
  const arr = Array.isArray(input) ? input.map(s => String(s || '').trim().slice(0, 300)) : [];
  while (arr.length < 3) arr.push('');
  return arr.slice(0, 3);
}

function normalizeTags(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const t = String(raw || '').trim().toLowerCase().slice(0, 32);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 12) break;
  }
  return out;
}

function sanitizeMood(mood) {
  if (!mood) return '';
  return MOODS.includes(mood) ? mood : '';
}

function buildPayload(body = {}) {
  const payload = {};
  if (body.title !== undefined) payload.title = String(body.title).trim().slice(0, 200);
  if (body.content !== undefined) {
    payload.content = String(body.content).slice(0, 50000);
    payload.wordCount = countWords(payload.content);
  }
  if (body.mood !== undefined) payload.mood = sanitizeMood(body.mood);
  if (body.manifestations !== undefined) payload.manifestations = normalizeManifestations(body.manifestations);
  if (body.tags !== undefined) payload.tags = normalizeTags(body.tags);
  if (body.favorite !== undefined) payload.favorite = Boolean(body.favorite);
  if (body.locked !== undefined) payload.locked = Boolean(body.locked);
  // AI slot reserved — ignore client writes for now except explicit null clear by server tools
  return payload;
}

const getJournals = async (req, res) => {
  try {
    const filter = { user: req.user._id, deletedAt: null };

    if (req.query.month && /^\d{4}-\d{2}$/.test(req.query.month)) {
      filter.journalDate = { $regex: `^${req.query.month}` };
    }
    if (req.query.year && /^\d{4}$/.test(req.query.year)) {
      filter.journalDate = { $regex: `^${req.query.year}` };
    }
    if (req.query.from || req.query.to) {
      filter.journalDate = filter.journalDate || {};
      if (req.query.from) filter.journalDate.$gte = req.query.from;
      if (req.query.to) filter.journalDate.$lte = req.query.to;
    }
    if (req.query.favorite === 'true') filter.favorite = true;
    if (req.query.mood && MOODS.includes(req.query.mood)) filter.mood = req.query.mood;
    if (req.query.tag) filter.tags = req.query.tag.toLowerCase().trim();

    if (req.query.q?.trim()) {
      const q = req.query.q.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }

    const journals = await Journal.find(filter)
      .sort({ journalDate: -1, updatedAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 365, 500));

    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'JOURNAL_FETCH_ERROR' });
  }
};

const getJournalByDate = async (req, res) => {
  try {
    const date = DATE_RE.test(req.params.date) ? req.params.date : null;
    if (!date) {
      return res.status(400).json({ message: 'Invalid date', code: 'VALIDATION_ERROR' });
    }
    const journal = await Journal.findOne({
      user: req.user._id,
      journalDate: date,
      deletedAt: null,
    });
    res.json(journal || null);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'JOURNAL_FETCH_ERROR' });
  }
};

const getJournalDates = async (req, res) => {
  try {
    const filter = { user: req.user._id, deletedAt: null };
    if (req.query.month && /^\d{4}-\d{2}$/.test(req.query.month)) {
      filter.journalDate = { $regex: `^${req.query.month}` };
    }
    const dates = await Journal.find(filter).select('journalDate mood favorite').lean();
    res.json(dates);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'JOURNAL_DATES_ERROR' });
  }
};

const getStats = async (req, res) => {
  try {
    const journals = await Journal.find({
      user: req.user._id,
      deletedAt: null,
    }).select('journalDate wordCount mood content').lean();

    const totalJournals = journals.length;
    const totalWords = journals.reduce((s, j) => s + (j.wordCount || countWords(j.content)), 0);

    const moodCounts = {};
    for (const j of journals) {
      if (!j.mood) continue;
      moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
    }
    let mostCommonMood = null;
    let max = 0;
    for (const [mood, n] of Object.entries(moodCounts)) {
      if (n > max) { max = n; mostCommonMood = mood; }
    }

    const dateSet = new Set(journals.map(j => j.journalDate));
    const sorted = [...dateSet].sort();
    const today = toDateKey(new Date());

    // Current streak: consecutive days ending today or yesterday
    let currentStreak = 0;
    let cursor = dateSet.has(today) ? today : addDays(today, -1);
    while (dateSet.has(cursor)) {
      currentStreak += 1;
      cursor = addDays(cursor, -1);
      if (currentStreak > 5000) break;
    }

    // Longest streak
    let longestStreak = 0;
    let run = 0;
    let prev = null;
    for (const key of sorted) {
      if (!prev || addDays(prev, 1) === key) run += 1;
      else run = 1;
      if (run > longestStreak) longestStreak = run;
      prev = key;
    }

    res.json({
      totalJournals,
      currentStreak,
      longestStreak,
      totalWords,
      mostCommonMood,
      moodCounts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'JOURNAL_STATS_ERROR' });
  }
};

const getCounts = async (req, res) => {
  try {
    const today = toDateKey(new Date());
    const [total, hasToday] = await Promise.all([
      Journal.countDocuments({ user: req.user._id, deletedAt: null }),
      Journal.exists({ user: req.user._id, journalDate: today, deletedAt: null }),
    ]);
    res.json({ journals: total, wroteToday: Boolean(hasToday) });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'JOURNAL_COUNTS_ERROR' });
  }
};

/** Upsert today's (or given date) entry — primary write path for auto-save */
const upsertJournal = async (req, res) => {
  try {
    const journalDate = DATE_RE.test(req.body.journalDate)
      ? req.body.journalDate
      : toDateKey(new Date());

    const payload = buildPayload(req.body);
    if (payload.content === undefined && payload.title === undefined
      && payload.mood === undefined && payload.manifestations === undefined) {
      // Allow empty create for opening diary
    }

    const existing = await Journal.findOne({
      user: req.user._id,
      journalDate,
      deletedAt: null,
    });

    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return res.json(existing);
    }

    const journal = await Journal.create({
      user: req.user._id,
      journalDate,
      title: payload.title || '',
      content: payload.content || '',
      mood: payload.mood || '',
      manifestations: payload.manifestations || ['', '', ''],
      tags: payload.tags || [],
      favorite: payload.favorite || false,
      locked: payload.locked || false,
      wordCount: payload.wordCount ?? countWords(payload.content || ''),
      aiReflection: null,
    });
    res.status(201).json(journal);
  } catch (err) {
    if (err.code === 11000) {
      // Race: retry as update
      try {
        const journalDate = DATE_RE.test(req.body.journalDate)
          ? req.body.journalDate
          : toDateKey(new Date());
        const journal = await Journal.findOne({
          user: req.user._id,
          journalDate,
          deletedAt: null,
        });
        if (journal) {
          Object.assign(journal, buildPayload(req.body));
          await journal.save();
          return res.json(journal);
        }
      } catch { /* fall through */ }
    }
    res.status(500).json({ message: err.message, code: 'JOURNAL_SAVE_ERROR' });
  }
};

const updateJournal = async (req, res) => {
  try {
    const journal = await Journal.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found', code: 'JOURNAL_NOT_FOUND' });
    }
    Object.assign(journal, buildPayload(req.body));
    await journal.save();
    res.json(journal);
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'JOURNAL_UPDATE_ERROR' });
  }
};

const deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found', code: 'JOURNAL_NOT_FOUND' });
    }

    if (req.query.permanent === 'true') {
      await Journal.deleteOne({ _id: journal._id });
      return res.json({ message: 'Journal permanently deleted' });
    }

    journal.deletedAt = new Date();
    await journal.save();
    res.json({ message: 'Journal deleted', journal });
  } catch (err) {
    res.status(500).json({ message: err.message, code: 'JOURNAL_DELETE_ERROR' });
  }
};

/**
 * Placeholder for future AI Reflection.
 * Returns 501 so the frontend can show a coming-soon state without inventing data.
 */
const reflectWithAi = async (req, res) => {
  res.status(501).json({
    message: 'AI Reflection is coming soon',
    code: 'AI_NOT_IMPLEMENTED',
    hint: 'POST /api/journals/:id/reflect will generate insights into journal.aiReflection',
  });
};

module.exports = {
  getJournals,
  getJournalByDate,
  getJournalDates,
  getStats,
  getCounts,
  upsertJournal,
  updateJournal,
  deleteJournal,
  reflectWithAi,
};
