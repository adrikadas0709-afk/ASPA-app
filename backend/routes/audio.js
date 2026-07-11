const express    = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const audioCtrl  = require('../controllers/audioController');
const router     = express.Router();

router.get('/',         optionalAuth, audioCtrl.listFiles);
router.post('/upload',  optionalAuth, upload.single('audio'), audioCtrl.upload);
router.get('/:id',      optionalAuth, audioCtrl.getAnalysis);
router.delete('/:id',   optionalAuth, audioCtrl.deleteFile);

module.exports = router;
