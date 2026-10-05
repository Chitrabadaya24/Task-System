const router = require('express').Router();
const { getSchedules, createSchedule, updateSchedule, deleteSchedule, restoreSchedule } = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getSchedules).post(createSchedule);
router.route('/:id/restore').put(restoreSchedule);
router.route('/:id').put(updateSchedule).delete(deleteSchedule);

module.exports = router;
