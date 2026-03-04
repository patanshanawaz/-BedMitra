
const router = require('express').Router();
const { login, register, getMe, changePassword, getStaff, toggleStaff } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
router.post('/login', login);
router.post('/register', authenticate, authorize('super_admin','hospital_admin'), register);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);
router.get('/staff', authenticate, authorize('super_admin','hospital_admin'), getStaff);
router.patch('/staff/:userId/toggle', authenticate, authorize('super_admin','hospital_admin'), toggleStaff);
module.exports = router;
