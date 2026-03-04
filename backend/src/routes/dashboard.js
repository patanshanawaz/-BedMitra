
const router = require('express').Router();
const { getHospitalDashboard, getSuperAdminDashboard } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
router.get('/hospital/:hospitalId?', authenticate, getHospitalDashboard);
router.get('/admin', authenticate, authorize('super_admin'), getSuperAdminDashboard);
module.exports = router;
