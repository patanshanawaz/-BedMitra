
const router = require('express').Router({ mergeParams: true });
const { getWards,createWard,updateWard,updateBedCount } = require('../controllers/wardController');
const { authenticate, authorize } = require('../middleware/auth');
router.get('/', getWards);
router.post('/', authenticate, authorize('super_admin','hospital_admin'), createWard);
router.put('/:wardId', authenticate, authorize('super_admin','hospital_admin'), updateWard);
router.patch('/:wardId/bed-count', authenticate, updateBedCount);
module.exports = router;
