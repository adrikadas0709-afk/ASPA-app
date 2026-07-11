const express  = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const aiCtrl   = require('../controllers/aiController');
const router   = express.Router();

router.post('/chat',           optionalAuth, aiCtrl.chat);
router.post('/troubleshoot',   optionalAuth, aiCtrl.troubleshoot);
router.post('/explain-filter', optionalAuth, aiCtrl.explainFilter);

module.exports = router;
