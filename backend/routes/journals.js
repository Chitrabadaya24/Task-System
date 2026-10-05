const router = require('express').Router();
const {
  getJournals,
  getJournalByDate,
  getJournalDates,
  getStats,
  getCounts,
  upsertJournal,
  updateJournal,
  deleteJournal,
  reflectWithAi,
} = require('../controllers/journalController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/counts', getCounts);
router.get('/stats', getStats);
router.get('/dates', getJournalDates);
router.get('/date/:date', getJournalByDate);

router.route('/').get(getJournals).post(upsertJournal);
router.route('/:id/reflect').post(reflectWithAi);
router.route('/:id').put(updateJournal).delete(deleteJournal);

module.exports = router;
