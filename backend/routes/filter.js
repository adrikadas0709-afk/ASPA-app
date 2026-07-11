const express    = require('express');
const filterCtrl = require('../controllers/filterController');
const router     = express.Router();

router.post('/calculate', filterCtrl.calculate);
router.post('/batch',     filterCtrl.batchCalculate);

module.exports = router;
