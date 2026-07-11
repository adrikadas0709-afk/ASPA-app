const express  = require('express');
const { protect } = require('../middleware/auth');
const projCtrl = require('../controllers/projectController');
const router   = express.Router();

router.use(protect);

router.route('/')
  .get(projCtrl.getProjects)
  .post(projCtrl.createProject);

router.get('/tags', projCtrl.getTags);

router.route('/:id')
  .get(projCtrl.getProject)
  .put(projCtrl.updateProject)
  .delete(projCtrl.deleteProject);

router.patch('/:id/favorite', projCtrl.toggleFavorite);

module.exports = router;
