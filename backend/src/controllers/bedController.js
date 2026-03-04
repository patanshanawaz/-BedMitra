
const { pool } = require('../config/db');

const getBeds = async (req, res) => {
  try {
    const { wardId } = req.params;
    const [beds] = await pool.execute(
      `SELECT b.*,p.name as patient_name,p.age,p.gender,p.diagnosis,p.admitted_at as patient_since
       FROM beds b LEFT JOIN patients p ON b.patient_id=p.id WHERE b.ward_id=? ORDER BY b.bed_number`, [wardId]
    );
    res.json({ success: true, data: beds });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getAvailableBeds = async (req, res) => {
  try {
    const { wardId } = req.params;
    const [beds] = await pool.execute(
      `SELECT id,bed_number FROM beds WHERE ward_id=? AND status='available' ORDER BY bed_number`, [wardId]
    );
    res.json({ success: true, data: beds });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const updateBedStatus = async (req, res) => {
  try {
    const { bedId } = req.params;
    const { status, notes } = req.body;
    const [beds] = await pool.execute('SELECT * FROM beds WHERE id=?', [bedId]);
    if (!beds.length) return res.status(404).json({ success: false, message: 'Bed not found.' });
    const bed = beds[0];
    await pool.execute('UPDATE beds SET status=?,notes=? WHERE id=?', [status, notes||'', bedId]);
    await pool.execute(
      `INSERT INTO bed_history (bed_id,ward_id,hospital_id,action,performed_by,notes) VALUES (?,?,?,?,?,?)`,
      [bedId, bed.ward_id, bed.hospital_id, status==='maintenance'?'maintenance_start':'released', req.user.id, notes||'']
    );
    await pool.execute(
      `UPDATE icu_wards SET
        occupied_beds=(SELECT COUNT(*) FROM beds WHERE ward_id=? AND status='occupied'),
        available_beds=(SELECT COUNT(*) FROM beds WHERE ward_id=? AND status='available'),
        under_maintenance=(SELECT COUNT(*) FROM beds WHERE ward_id=? AND status='maintenance')
       WHERE id=?`,
      [bed.ward_id, bed.ward_id, bed.ward_id, bed.ward_id]
    );
    if (req.io) req.io.emit('bed_count_update', { hospitalId: bed.hospital_id, wardId: bed.ward_id });
    res.json({ success: true, message: 'Bed status updated.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getBeds, getAvailableBeds, updateBedStatus };
