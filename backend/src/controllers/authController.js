
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, hospital_id: user.hospital_id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
);

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    const [users] = await pool.execute(
      `SELECT u.*, h.name as hospital_name FROM users u LEFT JOIN hospitals h ON u.hospital_id = h.id WHERE u.email=? AND u.is_active=TRUE`, [email]
    );
    if (!users.length) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const user = users[0];
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    await pool.execute('UPDATE users SET last_login=NOW() WHERE id=?', [user.id]);
    const token = generateToken(user);
    const { password: _, ...userData } = user;
    res.json({ success: true, message: 'Login successful.', token, user: userData });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, hospital_id } = req.body;
    const [ex] = await pool.execute('SELECT id FROM users WHERE email=?', [email]);
    if (ex.length) return res.status(400).json({ success: false, message: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const [r] = await pool.execute(
      `INSERT INTO users (name,email,password,phone,role,hospital_id) VALUES (?,?,?,?,?,?)`,
      [name, email, hashed, phone||null, role||'hospital_staff', hospital_id||null]
    );
    res.status(201).json({ success: true, message: 'Staff registered.', userId: r.insertId });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getMe = async (req, res) => {
  try {
    const [u] = await pool.execute(
      `SELECT u.id,u.name,u.email,u.role,u.phone,u.hospital_id,u.last_login,h.name as hospital_name,h.emergency_phone,h.address as hospital_address
       FROM users u LEFT JOIN hospitals h ON u.hospital_id=h.id WHERE u.id=?`, [req.user.id]
    );
    res.json({ success: true, data: u[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [u] = await pool.execute('SELECT password FROM users WHERE id=?', [req.user.id]);
    if (!await bcrypt.compare(currentPassword, u[0].password)) return res.status(400).json({ success: false, message: 'Current password incorrect.' });
    await pool.execute('UPDATE users SET password=? WHERE id=?', [await bcrypt.hash(newPassword, 10), req.user.id]);
    res.json({ success: true, message: 'Password changed.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getStaff = async (req, res) => {
  try {
    const hId = req.user.role === 'super_admin' ? req.query.hospital_id : req.user.hospital_id;
    let q = `SELECT u.id,u.name,u.email,u.role,u.phone,u.is_active,u.last_login,h.name as hospital_name FROM users u LEFT JOIN hospitals h ON u.hospital_id=h.id WHERE u.role!='super_admin'`;
    const p = [];
    if (hId) { q += ' AND u.hospital_id=?'; p.push(hId); }
    q += ' ORDER BY u.name';
    const [s] = await pool.execute(q, p);
    res.json({ success: true, data: s });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const toggleStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.execute('UPDATE users SET is_active = NOT is_active WHERE id=?', [userId]);
    res.json({ success: true, message: 'Staff status toggled.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { login, register, getMe, changePassword, getStaff, toggleStaff };
