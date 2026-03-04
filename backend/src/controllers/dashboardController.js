
const { pool } = require('../config/db');

const getHospitalDashboard = async (req, res) => {
  try {
    const hospitalId = req.user.role === 'super_admin' ? req.params.hospitalId : req.user.hospital_id;
    const [wardStats] = await pool.execute(
      `SELECT ward_type,ward_name,total_beds,available_beds,occupied_beds,under_maintenance,cost_per_day,last_updated
       FROM icu_wards WHERE hospital_id=? AND is_active=TRUE`, [hospitalId]
    );
    const [summary] = await pool.execute(
      `SELECT SUM(total_beds) as total_icu_beds,SUM(available_beds) as total_available,SUM(occupied_beds) as total_occupied,SUM(under_maintenance) as total_maintenance,
       ROUND((SUM(occupied_beds)/NULLIF(SUM(total_beds),0))*100,1) as occupancy_rate
       FROM icu_wards WHERE hospital_id=? AND is_active=TRUE`, [hospitalId]
    );
    const [todayAdm] = await pool.execute(`SELECT COUNT(*) as count FROM patients WHERE hospital_id=? AND DATE(admitted_at)=CURDATE()`, [hospitalId]);
    const [todayDis] = await pool.execute(`SELECT COUNT(*) as count FROM patients WHERE hospital_id=? AND DATE(discharged_at)=CURDATE() AND status='discharged'`, [hospitalId]);
    const [current] = await pool.execute(`SELECT COUNT(*) as count FROM patients WHERE hospital_id=? AND status='admitted'`, [hospitalId]);
    const [activity] = await pool.execute(
      `SELECT bh.action,bh.created_at,b.bed_number,w.ward_name,u.name as performed_by,p.name as patient_name
       FROM bed_history bh LEFT JOIN beds b ON bh.bed_id=b.id LEFT JOIN icu_wards w ON bh.ward_id=w.id
       LEFT JOIN users u ON bh.performed_by=u.id LEFT JOIN patients p ON bh.patient_id=p.id
       WHERE bh.hospital_id=? ORDER BY bh.created_at DESC LIMIT 10`, [hospitalId]
    );
    const [weekly] = await pool.execute(
      `SELECT DATE(admitted_at) as date,COUNT(*) as admissions FROM patients
       WHERE hospital_id=? AND admitted_at>=DATE_SUB(NOW(),INTERVAL 7 DAY)
       GROUP BY DATE(admitted_at) ORDER BY date`, [hospitalId]
    );
    const [notifs] = await pool.execute(`SELECT * FROM notifications WHERE hospital_id=? ORDER BY created_at DESC LIMIT 5`, [hospitalId]);
    const [patients] = await pool.execute(
      `SELECT p.id,p.name,p.age,p.gender,p.blood_group,p.diagnosis,p.admission_type,p.admitted_at,p.contact_number,
              w.ward_name,w.ward_type,b.bed_number
       FROM patients p LEFT JOIN icu_wards w ON p.ward_id=w.id LEFT JOIN beds b ON p.bed_id=b.id
       WHERE p.hospital_id=? AND p.status='admitted' ORDER BY p.admitted_at DESC`, [hospitalId]
    );
    res.json({ success: true, data: { summary: summary[0], wardStats, todayAdmissions: todayAdm[0].count, todayDischarges: todayDis[0].count, currentPatients: current[0].count, recentActivity: activity, weeklyAdmissions: weekly, notifications: notifs, admittedPatients: patients } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getSuperAdminDashboard = async (req, res) => {
  try {
    const [cityStats] = await pool.execute(
      `SELECT c.name as city,c.state,COUNT(DISTINCT h.id) as hospitals,COALESCE(SUM(w.total_beds),0) as total_beds,COALESCE(SUM(w.available_beds),0) as available_beds,COALESCE(ROUND((SUM(w.occupied_beds)/NULLIF(SUM(w.total_beds),0))*100,1),0) as occupancy
       FROM cities c LEFT JOIN hospitals h ON h.city_id=c.id AND h.is_active=TRUE LEFT JOIN icu_wards w ON w.hospital_id=h.id AND w.is_active=TRUE GROUP BY c.id ORDER BY total_beds DESC`
    );
    const [overall] = await pool.execute(
      `SELECT COUNT(DISTINCT h.id) as total_hospitals,COALESCE(SUM(w.total_beds),0) as total_icu_beds,COALESCE(SUM(w.available_beds),0) as total_available,COALESCE(SUM(w.occupied_beds),0) as total_occupied,COALESCE(ROUND((SUM(w.occupied_beds)/NULLIF(SUM(w.total_beds),0))*100,1),0) as overall_occupancy
       FROM hospitals h LEFT JOIN icu_wards w ON w.hospital_id=h.id AND w.is_active=TRUE WHERE h.is_active=TRUE`
    );
    const [topHospitals] = await pool.execute(
      `SELECT h.id,h.name,c.name as city,COALESCE(SUM(w.available_beds),0) as available_beds,COALESCE(SUM(w.total_beds),0) as total_beds,ROUND((SUM(w.occupied_beds)/NULLIF(SUM(w.total_beds),0))*100,1) as occupancy
       FROM hospitals h JOIN cities c ON h.city_id=c.id LEFT JOIN icu_wards w ON w.hospital_id=h.id AND w.is_active=TRUE WHERE h.is_active=TRUE GROUP BY h.id ORDER BY occupancy DESC LIMIT 10`
    );
    const [wardDist] = await pool.execute(`SELECT ward_type,SUM(total_beds) as total,SUM(available_beds) as available,SUM(occupied_beds) as occupied FROM icu_wards WHERE is_active=TRUE GROUP BY ward_type ORDER BY total DESC`);
    res.json({ success: true, data: { cityStats, overallStats: overall[0], topHospitals, wardTypeDistribution: wardDist } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getHospitalDashboard, getSuperAdminDashboard };
