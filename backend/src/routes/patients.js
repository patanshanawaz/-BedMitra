
const router = require('express').Router({ mergeParams: true });
const { admitPatient,dischargePatient,getPatients,getPatientById } = require('../controllers/patientController');
const { authenticate } = require('../middleware/auth');
router.get('/', authenticate, getPatients);
router.post('/admit', authenticate, admitPatient);
router.get('/:patientId', authenticate, getPatientById);
router.patch('/:patientId/discharge', authenticate, dischargePatient);
module.exports = router;
