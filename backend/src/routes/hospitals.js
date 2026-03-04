
const router = require('express').Router();
const { getHospitals,getHospitalById,createHospital,updateHospital,getCities,getStatsByCity } = require('../controllers/hospitalController');
const { authenticate, authorize } = require('../middleware/auth');
router.get('/cities', getCities);
router.get('/cities/:cityId/stats', getStatsByCity);
router.get('/', getHospitals);
router.get('/:id', getHospitalById);
router.post('/', authenticate, authorize('super_admin'), createHospital);
router.put('/:id', authenticate, authorize('super_admin','hospital_admin'), updateHospital);
module.exports = router;
