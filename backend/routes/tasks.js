const router = require('express').Router();
const { getTasks, getCounts, createTask, updateTask, deleteTask, restoreTask, emptyTrash } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/counts', getCounts);
router.delete('/trash', emptyTrash);
router.route('/').get(getTasks).post(createTask);
router.route('/:id/restore').put(restoreTask);
router.route('/:id').put(updateTask).delete(deleteTask);

module.exports = router;
