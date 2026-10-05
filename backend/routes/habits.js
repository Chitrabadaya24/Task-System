const router = require('express').Router();
const {
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
} = require('../controllers/habitController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/counts', getHabitCounts);
router.get('/stats', getStats);
router.get('/completions', getCompletions);

router.route('/').get(getHabits).post(createHabit);
router.route('/:id/toggle').put(toggleCompletion);
router.route('/:id/archive').put(archiveHabit);
router.route('/:id/pause').put(pauseHabit);
router.route('/:id').put(updateHabit).delete(deleteHabit);

module.exports = router;
