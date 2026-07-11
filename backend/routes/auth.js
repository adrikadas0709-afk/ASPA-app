const express = require('express');
const { protect } = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const router   = express.Router();

router.post('/register', authCtrl.register);
router.post('/login',    authCtrl.login);
router.get('/me',        protect, authCtrl.getMe);
router.patch('/me',      protect, authCtrl.updateMe);
router.patch('/password',protect, authCtrl.updatePassword);

module.exports = router;
