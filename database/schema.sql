-- ============================================================
-- BEDMITRA - DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS icu_bed_tracker;
USE icu_bed_tracker;

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (Super Admin + Hospital Admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'hospital_admin', 'hospital_staff') DEFAULT 'hospital_staff',
  hospital_id INT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  registration_number VARCHAR(100) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city_id INT NOT NULL,
  pincode VARCHAR(10),
  phone VARCHAR(20) NOT NULL,
  emergency_phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  website VARCHAR(200),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  type ENUM('government', 'private', 'trust', 'clinic') DEFAULT 'private',
  accreditation VARCHAR(100),
  total_beds INT DEFAULT 0,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- ICU Ward Types Table
CREATE TABLE IF NOT EXISTS icu_wards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  ward_type ENUM('General_ICU', 'NICU', 'CCU', 'PICU', 'SICU', 'MICU', 'Neuro_ICU', 'Burn_ICU', 'Trauma_ICU') NOT NULL,
  ward_name VARCHAR(200) NOT NULL,
  total_beds INT NOT NULL DEFAULT 0,
  available_beds INT NOT NULL DEFAULT 0,
  occupied_beds INT NOT NULL DEFAULT 0,
  under_maintenance INT NOT NULL DEFAULT 0,
  cost_per_day DECIMAL(10, 2) DEFAULT 0.00,
  features TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ward (hospital_id, ward_type)
);

-- Individual Beds Table
CREATE TABLE IF NOT EXISTS beds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ward_id INT NOT NULL,
  hospital_id INT NOT NULL,
  bed_number VARCHAR(20) NOT NULL,
  status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
  patient_id INT NULL,
  admitted_at TIMESTAMP NULL,
  notes TEXT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ward_id) REFERENCES icu_wards(id) ON DELETE CASCADE,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  age INT,
  gender ENUM('male', 'female', 'other'),
  blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  contact_number VARCHAR(20),
  emergency_contact VARCHAR(20),
  address TEXT,
  diagnosis TEXT,
  admission_type ENUM('emergency', 'planned', 'transfer') DEFAULT 'emergency',
  status ENUM('admitted', 'discharged', 'transferred', 'deceased') DEFAULT 'admitted',
  hospital_id INT NOT NULL,
  ward_id INT NOT NULL,
  bed_id INT NULL,
  admitted_by INT NOT NULL,
  admitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  discharged_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (ward_id) REFERENCES icu_wards(id),
  FOREIGN KEY (admitted_by) REFERENCES users(id)
);

-- Add FK for bed patient
ALTER TABLE beds ADD FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;

-- Bed History / Audit Log
CREATE TABLE IF NOT EXISTS bed_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bed_id INT NOT NULL,
  ward_id INT NOT NULL,
  hospital_id INT NOT NULL,
  patient_id INT NULL,
  action ENUM('admitted', 'discharged', 'transferred', 'maintenance_start', 'maintenance_end', 'reserved', 'released') NOT NULL,
  performed_by INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bed_id) REFERENCES beds(id),
  FOREIGN KEY (ward_id) REFERENCES icu_wards(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'critical', 'success') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert Cities
INSERT INTO cities (name, state, latitude, longitude) VALUES
('Hyderabad', 'Telangana', 17.3850, 78.4867),
('Bengaluru', 'Karnataka', 12.9716, 77.5946),
('Mumbai', 'Maharashtra', 19.0760, 72.8777),
('Chennai', 'Tamil Nadu', 13.0827, 80.2707),
('Delhi', 'Delhi', 28.6139, 77.2090),
('Pune', 'Maharashtra', 18.5204, 73.8567),
('Kolkata', 'West Bengal', 22.5726, 88.3639),
('Ahmedabad', 'Gujarat', 23.0225, 72.5714);

-- Insert Super Admin
INSERT INTO users (name, email, password, role) VALUES
('Super Admin', 'admin@bedmitra.com', '$2a$10$uIIsx7G7AiIeSzkJtFiiTevHR2QSDW4UXaP6zw.u/TZmgi.VwQ4lu', 'super_admin');
-- Password: Admin@123456

-- Insert Sample Hospitals (Hyderabad)
INSERT INTO hospitals (name, registration_number, address, city_id, pincode, phone, emergency_phone, email, type, total_beds, latitude, longitude, is_verified, description, accreditation) VALUES
('Apollo Hospitals Jubilee Hills', 'APJH2024001', 'Film Nagar, Jubilee Hills, Hyderabad', 1, '500033', '040-23607777', '040-23607999', 'info@apollohyderabad.com', 'private', 550, 17.4239, 78.4077, TRUE, 'One of the largest super-specialty hospitals in Hyderabad', 'NABH, JCI'),
('KIMS Hospital Secunderabad', 'KIMS2024002', 'Minister Road, Secunderabad, Hyderabad', 1, '500003', '040-44885000', '040-44885999', 'info@kimshealth.com', 'private', 480, 17.4399, 78.4983, TRUE, 'Krishna Institute of Medical Sciences - Premium Healthcare', 'NABH'),
('Yashoda Hospital Malakpet', 'YHM2024003', 'Nalgonda X Road, Malakpet, Hyderabad', 1, '500036', '040-45678900', '040-45678911', 'info@yashodahospitals.com', 'private', 320, 17.3756, 78.5062, TRUE, 'Yashoda Hospitals - Quality Care for All', 'NABH'),
('Osmania General Hospital', 'OGH2024004', 'Afzalgunj, Hyderabad', 1, '500012', '040-24600100', '040-24600199', 'info@ogh.gov.in', 'government', 900, 17.3850, 78.4700, TRUE, 'Premier Government Hospital serving Greater Hyderabad', 'NABH'),
('Rainbow Childrens Hospital', 'RCH2024005', 'Banjara Hills Road No. 10, Hyderabad', 1, '500034', '040-71220000', '040-71220011', 'info@rainbowhospitals.in', 'private', 200, 17.4126, 78.4471, TRUE, 'Best Pediatric Hospital in Hyderabad - NICU Specialists', 'NABH, JCI'),
('Care Hospitals HITEC City', 'CHH2024006', 'Road No. 1, HITEC City, Hyderabad', 1, '500081', '040-67777777', '040-67777999', 'info@carehospitals.com', 'private', 260, 17.4456, 78.3794, TRUE, 'CARE Hospitals - Compassionate Care', 'NABH'),
('Nizam\'s Institute of Medical Sciences', 'NIMS2024007', 'Panjagutta, Hyderabad', 1, '500082', '040-23489000', '040-23489999', 'info@nims.edu.in', 'government', 700, 17.4239, 78.4493, TRUE, 'Apex Referral Government Hospital - Hyderabad', 'NABH'),
('Sparsh Hospital Banjara Hills', 'SH2024008', 'Road No. 12, Banjara Hills, Hyderabad', 1, '500034', '040-66779900', '040-66779999', 'info@sparshhospital.com', 'private', 180, 17.4126, 78.4471, TRUE, 'Multi-specialty Hospital with State-of-Art Facilities', 'NABH'),
('Medicover Hospitals Nampally', 'MHN2024009', 'Nampally, Hyderabad', 1, '500001', '040-88019800', '040-88019999', 'info@medicover.com', 'private', 300, 17.3813, 78.4680, TRUE, 'World-class healthcare at affordable rates', 'NABH'),
('Continental Hospital Nanakramguda', 'CRN2024010', 'Financial District, Nanakramguda, Hyderabad', 1, '500032', '040-67000999', '040-67000911', 'info@continentalhospitals.com', 'private', 250, 17.4220, 78.3630, TRUE, 'JCI Accredited Hospital with Advanced ICU', 'NABH, JCI');

-- Insert ICU Wards for each hospital
-- Hospital 1: Apollo
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(1, 'General_ICU', 'Apollo General ICU', 20, 5, 14, 1, 15000.00, 'Ventilator,Cardiac Monitor,Central Line'),
(1, 'CCU', 'Apollo Cardiac Care Unit', 15, 3, 11, 1, 18000.00, 'Cardiac Monitor,Defibrillator,Echo Support'),
(1, 'NICU', 'Apollo Neonatal ICU', 10, 2, 8, 0, 12000.00, 'Incubator,Phototherapy,Oxygen Support'),
(1, 'SICU', 'Apollo Surgical ICU', 12, 4, 7, 1, 16000.00, 'Post-op Monitoring,Ventilator,Drains');

-- Hospital 2: KIMS
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(2, 'General_ICU', 'KIMS General ICU', 18, 0, 17, 1, 14000.00, 'Ventilator,Cardiac Monitor'),
(2, 'CCU', 'KIMS Coronary Care Unit', 12, 1, 10, 1, 17000.00, 'Cardiac Monitor,Pacemaker Support'),
(2, 'MICU', 'KIMS Medical ICU', 14, 3, 10, 1, 13500.00, 'Ventilator,Dialysis Support,ABG Monitor'),
(2, 'Trauma_ICU', 'KIMS Trauma ICU', 8, 2, 5, 1, 16500.00, 'Trauma Bay,CT Ready,Ventilator');

-- Hospital 3: Yashoda
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(3, 'General_ICU', 'Yashoda General ICU', 16, 6, 10, 0, 12000.00, 'Ventilator,Cardiac Monitor,Infusion Pump'),
(3, 'NICU', 'Yashoda Neonatal ICU', 8, 3, 5, 0, 10000.00, 'Incubator,Phototherapy'),
(3, 'CCU', 'Yashoda Cardiac ICU', 10, 4, 6, 0, 15000.00, 'Cardiac Monitor,Defibrillator');

-- Hospital 4: Osmania General
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(4, 'General_ICU', 'OGH General ICU', 30, 8, 20, 2, 3000.00, 'Ventilator,Cardiac Monitor'),
(4, 'Burn_ICU', 'OGH Burn ICU', 12, 3, 8, 1, 5000.00, 'Burn Dressing,Ventilator,Wound Care'),
(4, 'MICU', 'OGH Medical ICU', 20, 5, 14, 1, 2500.00, 'Ventilator,Dialysis Support'),
(4, 'Trauma_ICU', 'OGH Trauma ICU', 15, 4, 10, 1, 4000.00, 'Trauma Support,Ventilator');

-- Hospital 5: Rainbow
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(5, 'NICU', 'Rainbow Level-3 NICU', 20, 4, 15, 1, 15000.00, 'High-end Incubator,NO Therapy,Surfactant'),
(5, 'PICU', 'Rainbow Pediatric ICU', 15, 5, 9, 1, 14000.00, 'Pediatric Ventilator,Infusion Pump'),
(5, 'General_ICU', 'Rainbow General ICU', 10, 2, 8, 0, 12000.00, 'Ventilator,Monitor');

-- Hospital 6: CARE HITEC
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(6, 'General_ICU', 'CARE General ICU', 14, 3, 10, 1, 13000.00, 'Ventilator,Cardiac Monitor,Infusion Pump'),
(6, 'CCU', 'CARE Coronary ICU', 10, 0, 9, 1, 16000.00, 'Cardiac Monitor,Angiography Ready'),
(6, 'MICU', 'CARE Medical ICU', 12, 4, 7, 1, 12500.00, 'Ventilator,Dialysis');

-- Hospital 7: NIMS
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(7, 'General_ICU', 'NIMS General ICU', 25, 7, 17, 1, 4000.00, 'Ventilator,Cardiac Monitor'),
(7, 'Neuro_ICU', 'NIMS Neuro ICU', 18, 5, 12, 1, 6000.00, 'Neuro Monitor,Ventilator,EEG'),
(7, 'CCU', 'NIMS Cardiac Care Unit', 15, 3, 11, 1, 5500.00, 'Cardiac Monitor,Cath Lab Access'),
(7, 'PICU', 'NIMS Pediatric ICU', 12, 4, 8, 0, 4500.00, 'Pediatric Ventilator');

-- Hospital 8: Sparsh
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(8, 'General_ICU', 'Sparsh General ICU', 12, 5, 6, 1, 11000.00, 'Ventilator,Monitor,Infusion'),
(8, 'SICU', 'Sparsh Surgical ICU', 8, 2, 5, 1, 14000.00, 'Post-Op,Ventilator');

-- Hospital 9: Medicover
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(9, 'General_ICU', 'Medicover General ICU', 16, 6, 9, 1, 12000.00, 'Ventilator,Cardiac Monitor,Infusion'),
(9, 'CCU', 'Medicover Coronary Care', 10, 2, 7, 1, 15000.00, 'Cardiac Monitor,Cath Access'),
(9, 'NICU', 'Medicover Neonatal ICU', 8, 3, 5, 0, 11000.00, 'Incubator,O2 Support');

-- Hospital 10: Continental
INSERT INTO icu_wards (hospital_id, ward_type, ward_name, total_beds, available_beds, occupied_beds, under_maintenance, cost_per_day, features) VALUES
(10, 'General_ICU', 'Continental General ICU', 18, 4, 13, 1, 14000.00, 'Ventilator,Hemodynamic Monitor,Echo'),
(10, 'CCU', 'Continental Cardiac ICU', 12, 1, 10, 1, 18000.00, 'Advanced Cardiac Monitor,Cath Lab'),
(10, 'SICU', 'Continental Surgical ICU', 10, 3, 6, 1, 15000.00, 'Post-Op,Ventilator,Drain Monitor'),
(10, 'Trauma_ICU', 'Continental Trauma ICU', 8, 2, 5, 1, 16000.00, 'Trauma Bay,Rapid CT,Ventilator');

-- Create Stored Procedures for auto-updating ward availability
DELIMITER //
CREATE PROCEDURE UpdateWardAvailability(IN p_ward_id INT)
BEGIN
  UPDATE icu_wards
  SET
    occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = p_ward_id AND status = 'occupied'),
    available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = p_ward_id AND status = 'available'),
    under_maintenance = (SELECT COUNT(*) FROM beds WHERE ward_id = p_ward_id AND status = 'maintenance')
  WHERE id = p_ward_id;
END //
DELIMITER ;

-- Triggers to auto sync ward bed counts
DELIMITER //
CREATE TRIGGER after_bed_status_update
AFTER UPDATE ON beds
FOR EACH ROW
BEGIN
  CALL UpdateWardAvailability(NEW.ward_id);
END //
DELIMITER ;

-- Views for quick queries
CREATE VIEW v_hospital_availability AS
SELECT
  h.id as hospital_id,
  h.name as hospital_name,
  h.phone,
  h.emergency_phone,
  h.address,
  h.latitude,
  h.longitude,
  h.type,
  c.name as city,
  c.state,
  SUM(w.total_beds) as total_icu_beds,
  SUM(w.available_beds) as total_available_beds,
  SUM(w.occupied_beds) as total_occupied_beds,
  ROUND((SUM(w.occupied_beds) / NULLIF(SUM(w.total_beds), 0)) * 100, 1) as occupancy_percent,
  h.is_active,
  h.is_verified,
  w.last_updated
FROM hospitals h
JOIN cities c ON h.city_id = c.id
JOIN icu_wards w ON h.id = w.hospital_id
WHERE h.is_active = TRUE AND w.is_active = TRUE
GROUP BY h.id, h.name, h.phone, h.emergency_phone, h.address, h.latitude, h.longitude, h.type, c.name, c.state, h.is_active, h.is_verified, w.last_updated;
