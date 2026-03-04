
const router = require('express').Router({ mergeParams: true });
const { getBeds,getAvailableBeds,updateBedStatus } = require('../controllers/bedController');
const { authenticate } = require('../middleware/auth');
router.get('/', authenticate, getBeds);
router.get('/available', authenticate, getAvailableBeds);
router.patch('/:bedId/status', authenticate, updateBedStatus);
module.exports = router;
