const { pool } = require('../config/db');

// Admit patient (allocate bed)
const admitPatient = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name, age, gender, blood_group, contact_number, emergency_contact,
      address, diagnosis, admission_type, hospital_id, ward_id, bed_id, notes
    } = req.body;

    // Create patient record
    const [patientResult] = await connection.execute(
      `INSERT INTO patients (name, age, gender, blood_group, contact_number, emergency_contact,
       address, diagnosis, admission_type, hospital_id, ward_id, bed_id, admitted_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, age, gender, blood_group, contact_number, emergency_contact,
       address, diagnosis, admission_type || 'emergency', hospital_id, ward_id, bed_id || null, req.user.id, notes]
    );

    const patientId = patientResult.insertId;

    // Update bed status if bed_id provided
    if (bed_id) {
      const [bedCheck] = await connection.execute(
        'SELECT status FROM beds WHERE id = ? AND ward_id = ?', [bed_id, ward_id]
      );
      if (bedCheck.length === 0 || bedCheck[0].status !== 'available') {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Bed is not available.' });
      }

      await connection.execute(
        `UPDATE beds SET status = 'occupied', patient_id = ?, admitted_at = NOW() WHERE id = ?`,
        [patientId, bed_id]
      );

      // Log bed history
      await connection.execute(
        `INSERT INTO bed_history (bed_id, ward_id, hospital_id, patient_id, action, performed_by, notes)
         VALUES (?, ?, ?, ?, 'admitted', ?, ?)`,
        [bed_id, ward_id, hospital_id, patientId, req.user.id, notes || '']
      );
    }

    // Update ward counts
    await connection.execute(
      `UPDATE icu_wards SET
         occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = ? AND status = 'occupied'),
         available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = ? AND status = 'available')
       WHERE id = ?`,
      [ward_id, ward_id, ward_id]
    );

    await connection.commit();

    // Emit real-time update
    if (req.io) {
      req.io.to(`hospital_${hospital_id}`).emit('patient_admitted', { hospitalId: hospital_id, wardId: ward_id });
      req.io.emit('bed_count_update', { hospitalId: hospital_id });
    }

    // Create notification
    await pool.execute(
      `INSERT INTO notifications (hospital_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [hospital_id, 'New Patient Admitted', `Patient ${name} admitted to ${admission_type} ward.`, 'info']
    );

    res.status(201).json({
      success: true,
      message: `Patient ${name} admitted successfully.`,
      patientId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Admit patient error:', error);
    res.status(500).json({ success: false, message: 'Server error admitting patient.' });
  } finally {
    connection.release();
  }
};

// Discharge patient
const dischargePatient = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { patientId } = req.params;
    const { discharge_notes, status } = req.body;

    const [patients] = await connection.execute(
      'SELECT * FROM patients WHERE id = ? AND status = "admitted"', [patientId]
    );

    if (patients.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Active patient not found.' });
    }

    const patient = patients[0];

    // Update patient status
    await connection.execute(
      `UPDATE patients SET status = ?, discharged_at = NOW(), notes = CONCAT(COALESCE(notes,''), ' | Discharge: ', ?) WHERE id = ?`,
      [status || 'discharged', discharge_notes || '', patientId]
    );

    // Free up the bed
    if (patient.bed_id) {
      await connection.execute(
        `UPDATE beds SET status = 'available', patient_id = NULL, admitted_at = NULL WHERE id = ?`,
        [patient.bed_id]
      );

      await connection.execute(
        `INSERT INTO bed_history (bed_id, ward_id, hospital_id, patient_id, action, performed_by, notes)
         VALUES (?, ?, ?, ?, 'discharged', ?, ?)`,
        [patient.bed_id, patient.ward_id, patient.hospital_id, patientId, req.user.id, discharge_notes || '']
      );
    }

    // Update ward counts
    await connection.execute(
      `UPDATE icu_wards SET
         occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = ? AND status = 'occupied'),
         available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = ? AND status = 'available')
       WHERE id = ?`,
      [patient.ward_id, patient.ward_id, patient.ward_id]
    );

    await connection.commit();

    if (req.io) {
      req.io.to(`hospital_${patient.hospital_id}`).emit('patient_discharged', {
        hospitalId: patient.hospital_id, wardId: patient.ward_id
      });
      req.io.emit('bed_count_update', { hospitalId: patient.hospital_id });
    }

    res.json({ success: true, message: 'Patient discharged successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('Discharge error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    connection.release();
  }
};

// Get all patients for a hospital
const getPatients = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { status, ward_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, w.ward_name, w.ward_type, b.bed_number,
             u.name as admitted_by_name
      FROM patients p
      LEFT JOIN icu_wards w ON p.ward_id = w.id
      LEFT JOIN beds b ON p.bed_id = b.id
      LEFT JOIN users u ON p.admitted_by = u.id
      WHERE p.hospital_id = ?
    `;
    const params = [hospitalId];

    if (status) { query += ` AND p.status = ?`; params.push(status); }
    if (ward_id) { query += ` AND p.ward_id = ?`; params.push(ward_id); }

    query += ` ORDER BY p.admitted_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [patients] = await pool.execute(query, params);
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get single patient
const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const [patients] = await pool.execute(
      `SELECT p.*, w.ward_name, w.ward_type, b.bed_number, u.name as admitted_by_name,
              h.name as hospital_name
       FROM patients p
       LEFT JOIN icu_wards w ON p.ward_id = w.id
       LEFT JOIN beds b ON p.bed_id = b.id
       LEFT JOIN users u ON p.admitted_by = u.id
       LEFT JOIN hospitals h ON p.hospital_id = h.id
       WHERE p.id = ?`,
      [patientId]
    );

    if (patients.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Get bed history
    const [history] = await pool.execute(
      `SELECT bh.*, u.name as performed_by_name, b.bed_number
       FROM bed_history bh
       LEFT JOIN users u ON bh.performed_by = u.id
       LEFT JOIN beds b ON bh.bed_id = b.id
       WHERE bh.patient_id = ? ORDER BY bh.created_at DESC`,
      [patientId]
    );

    res.json({ success: true, data: { ...patients[0], history } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { admitPatient, dischargePatient, getPatients, getPatientById };
