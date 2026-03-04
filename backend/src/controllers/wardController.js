
const { pool } = require('../config/db');

const getWards = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const [wards] = await pool.execute(
      `SELECT * FROM icu_wards WHERE hospital_id=? AND is_active=TRUE ORDER BY ward_type`, [hospitalId]
    );
    res.json({ success: true, data: wards });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const createWard = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { ward_type, ward_name, total_beds, cost_per_day, features } = req.body;
    const [r] = await pool.execute(
      `INSERT INTO icu_wards (hospital_id,ward_type,ward_name,total_beds,available_beds,cost_per_day,features) VALUES (?,?,?,?,?,?,?)`,
      [hospitalId, ward_type, ward_name, total_beds, total_beds, cost_per_day||0, features||'']
    );
    const wardId = r.insertId;
    // auto-create beds
    if (total_beds > 0) {
      const vals = [];
      const ph = [];
      for (let i = 1; i <= total_beds; i++) {
        ph.push('(?,?,?)');
        vals.push(wardId, hospitalId, `${ward_type.substring(0,3).toUpperCase()}-${String(i).padStart(3,'0')}`);
      }
      await pool.execute(`INSERT INTO beds (ward_id,hospital_id,bed_number) VALUES ${ph.join(',')}`, vals);
    }
    res.status(201).json({ success: true, message: 'Ward and beds created.', wardId });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const updateWard = async (req, res) => {
  try {
    const { wardId } = req.params;
    const { ward_name, cost_per_day, features, is_active } = req.body;
    await pool.execute(
      `UPDATE icu_wards SET ward_name=COALESCE(?,ward_name),cost_per_day=COALESCE(?,cost_per_day),features=COALESCE(?,features),is_active=COALESCE(?,is_active) WHERE id=?`,
      [ward_name||null, cost_per_day!=null?cost_per_day:null, features||null, is_active!=null?is_active:null, wardId]
    );
    res.json({ success: true, message: 'Ward updated.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const updateBedCount = async (req, res) => {
  try {
    const { hospitalId, wardId } = req.params;
    const { available_beds, occupied_beds, under_maintenance } = req.body;
    const total = parseInt(available_beds)+parseInt(occupied_beds)+parseInt(under_maintenance);
    await pool.execute(
      `UPDATE icu_wards SET available_beds=?,occupied_beds=?,under_maintenance=?,total_beds=? WHERE id=? AND hospital_id=?`,
      [available_beds, occupied_beds, under_maintenance, total, wardId, hospitalId]
    );
    if (req.io) req.io.emit('bed_count_update', { hospitalId: parseInt(hospitalId), wardId: parseInt(wardId) });
    res.json({ success: true, message: 'Bed count updated in real-time.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getWards, createWard, updateWard, updateBedCount };
