const { pool } = require('../config/db');

// Get all hospitals (public) with availability
const getHospitals = async (req, res) => {
  try {
    const { city, type, availability, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT h.id, h.name, h.registration_number, h.address, h.phone, h.emergency_phone,
             h.email, h.website, h.latitude, h.longitude, h.type, h.accreditation,
             h.total_beds, h.description, h.image_url, h.is_verified, h.is_active,
             c.name as city, c.state,
             COALESCE(SUM(w.total_beds), 0) as total_icu_beds,
             COALESCE(SUM(w.available_beds), 0) as total_available_beds,
             COALESCE(SUM(w.occupied_beds), 0) as total_occupied_beds,
             COALESCE(ROUND((SUM(w.occupied_beds) / NULLIF(SUM(w.total_beds), 0)) * 100, 1), 0) as occupancy_percent,
             MAX(w.last_updated) as last_updated
      FROM hospitals h
      JOIN cities c ON h.city_id = c.id
      LEFT JOIN icu_wards w ON h.id = w.hospital_id AND w.is_active = TRUE
      WHERE h.is_active = TRUE
    `;
    const params = [];

    if (city) {
      query += ` AND (c.name LIKE ? OR c.id = ?)`;
      params.push(`%${city}%`, parseInt(city) || 0);
    }
    if (type) { query += ` AND h.type = ?`; params.push(type); }
    if (search) {
      query += ` AND (h.name LIKE ? OR h.address LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY h.id`;

    if (availability === 'available') {
      query += ` HAVING total_available_beds > 0`;
    } else if (availability === 'full') {
      query += ` HAVING total_available_beds = 0`;
    }

    query += ` ORDER BY total_available_beds DESC, h.name ASC LIMIT ${limitNum} OFFSET ${offset}`;

    const [hospitals] = await pool.execute(query, params);

    // Get count
    let countQuery = `SELECT COUNT(DISTINCT h.id) as total FROM hospitals h JOIN cities c ON h.city_id = c.id WHERE h.is_active = TRUE`;
    const countParams = [];
    if (city) { countQuery += ` AND (c.name LIKE ? OR c.id = ?)`; countParams.push(`%${city}%`, parseInt(city) || 0); }
    if (type) { countQuery += ` AND h.type = ?`; countParams.push(type); }
    if (search) { countQuery += ` AND (h.name LIKE ? OR h.address LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`); }

    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      success: true,
      data: hospitals,
      pagination: {
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(countResult[0].total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching hospitals.' });
  }
};

// Get single hospital details with ward breakdown
const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;

    const [hospitals] = await pool.execute(
      `SELECT h.*, c.name as city, c.state, c.latitude as city_lat, c.longitude as city_lng
       FROM hospitals h JOIN cities c ON h.city_id = c.id WHERE h.id = ?`,
      [id]
    );

    if (hospitals.length === 0) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    const [wards] = await pool.execute(
      `SELECT * FROM icu_wards WHERE hospital_id = ? AND is_active = TRUE ORDER BY ward_type`,
      [id]
    );

    const [admins] = await pool.execute(
      `SELECT id, name, email, phone, role FROM users WHERE hospital_id = ? AND is_active = TRUE`,
      [id]
    );

    res.json({
      success: true,
      data: { ...hospitals[0], wards, admins }
    });
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Create hospital (super admin only)
const createHospital = async (req, res) => {
  try {
    const {
      name, registration_number, address, city_id, pincode,
      phone, emergency_phone, email, website, latitude, longitude,
      type, accreditation, total_beds, description
    } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM hospitals WHERE registration_number = ?', [registration_number]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Registration number already exists.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO hospitals (name, registration_number, address, city_id, pincode, phone, emergency_phone,
       email, website, latitude, longitude, type, accreditation, total_beds, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, registration_number, address, city_id, pincode, phone, emergency_phone,
       email, website, latitude, longitude, type || 'private', accreditation, total_beds || 0, description]
    );

    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      hospitalId: result.insertId
    });
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ success: false, message: 'Server error creating hospital.' });
  }
};

// Update hospital
const updateHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const allowedFields = ['name', 'address', 'phone', 'emergency_phone', 'email', 'website',
      'latitude', 'longitude', 'type', 'accreditation', 'total_beds', 'description', 'is_active', 'is_verified'];

    const setClause = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => `${key} = ?`).join(', ');

    const values = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => updates[key]);

    if (values.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    values.push(id);
    await pool.execute(`UPDATE hospitals SET ${setClause} WHERE id = ?`, values);

    res.json({ success: true, message: 'Hospital updated successfully.' });
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get cities
const getCities = async (req, res) => {
  try {
    const [cities] = await pool.execute('SELECT * FROM cities ORDER BY name');
    res.json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get hospital stats by city
const getStatsByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const [stats] = await pool.execute(
      `SELECT
         COUNT(DISTINCT h.id) as total_hospitals,
         COALESCE(SUM(w.total_beds), 0) as total_icu_beds,
         COALESCE(SUM(w.available_beds), 0) as available_beds,
         COALESCE(SUM(w.occupied_beds), 0) as occupied_beds,
         COALESCE(ROUND((SUM(w.occupied_beds)/NULLIF(SUM(w.total_beds),0))*100,1), 0) as city_occupancy_percent
       FROM hospitals h
       LEFT JOIN icu_wards w ON h.id = w.hospital_id AND w.is_active = TRUE
       WHERE h.city_id = ? AND h.is_active = TRUE`,
      [cityId]
    );
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getHospitals, getHospitalById, createHospital, updateHospital, getCities, getStatsByCity };
