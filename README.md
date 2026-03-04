# 🏥 BedMitra — Your Trusted Friend for Finding ICU Beds
### Real-Time ICU Bed Availability Monitoring & Hospital Management System

> **A life-saving platform** that lets citizens find available ICU beds in real-time across hospitals in metropolitan cities like Hyderabad and Bengaluru. Built as a B.Tech Final Year Project.

**Developer:** [Patan Shanawaz](https://github.com/patanshanawaz)

---

## 🚀 Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React.js 18, React Router v6, Recharts, Socket.io-client, React Hot Toast, React Icons, Framer Motion |
| Backend | Node.js, Express.js, Socket.io |
| Database | MySQL 8.0+ |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Real-time | Socket.io (WebSocket) |

---

## 📁 Project Structure
```
bedmitra/
├── backend/          ← Node.js + Express API
├── frontend/         ← React.js App
└── database/
    └── schema.sql    ← Full DB with seeded data
```

---

## ⚡ Quick Setup (3 Steps)

### Step 1 — Database Setup
Open MySQL workbench or terminal:
```sql
mysql -u root -p
source /path/to/database/schema.sql
```
OR in MySQL Workbench: **File → Open SQL Script → Run** `database/schema.sql`

### Step 2 — Backend Setup
```bash
cd backend

# Edit .env — set your MySQL password:
# DB_PASSWORD=your_mysql_password

npm install
npm run dev
# Server starts at http://localhost:5001
```

### Step 3 — Frontend Setup
```bash
cd frontend
npm install
npm start
# App opens at http://localhost:3000
```

---

## 🔐 Login Credentials

### Super Admin (Full Platform Access)
```
Email:    admin@bedmitra.com
Password: Admin@123456
```

### Hospital Admin (after creating via Super Admin panel)
Each hospital admin is created through the Super Admin → Add Hospital flow.

---

## 🌐 Application Pages

### Public (No Login Required)
| URL | Description |
|---|---|
| `/` | Landing page with city search |
| `/hospitals` | Live hospital list with bed counts |
| `/hospitals/:id` | Detailed ICU ward breakdown for a hospital |
| `/login` | Hospital staff login |

### Hospital Staff Portal
| URL | Description |
|---|---|
| `/hospital/dashboard` | Live ICU stats + quick bed update |
| `/hospital/patients` | All admitted patients |
| `/hospital/patients/admit` | Admit new patient form |
| `/hospital/wards` | Ward management |
| `/hospital/wards/:id/beds` | Individual bed grid (click to change status) |
| `/hospital/staff` | Staff management |

### Super Admin Portal
| URL | Description |
|---|---|
| `/admin/dashboard` | Platform-wide analytics + city summaries |
| `/admin/hospitals` | All hospitals list |
| `/admin/hospitals/add` | Add new hospital (2-step) |

---

## 🔥 Key Features

### For Citizens (Public)
- 🔍 Search hospitals by city, type, availability
- 📊 Real-time bed counts — updated live as patients admitted/discharged
- 🟢 Color-coded availability (Green = available, Red = full)
- 📞 Emergency phone numbers on each hospital card
- Detailed ward breakdown (General ICU, NICU, CCU, PICU, SICU, Trauma ICU, Burn ICU)

### For Hospital Staff
- ⚡ **Quick Bed Count Update** — update available/occupied/maintenance instantly from dashboard
- 👤 **Admit Patients** — full admission form with ward + bed assignment
- 🏥 **Discharge Patients** — frees bed automatically, updates public count
- 🛏️ **Bed Grid View** — visual grid of all beds, click any bed to change status
- 📊 **Charts** — weekly admissions bar chart, ward distribution pie chart
- 🔔 Real-time activity log on dashboard

### For Super Admin
- 🌆 City-wise occupancy overview
- 🏆 Hospital rankings by occupancy
- 📈 Ward type distribution chart
- ➕ Add new hospitals + create admin accounts (2-step wizard)
- 👥 Staff management across all hospitals

### Real-time
- Socket.io WebSocket connection
- When any hospital updates bed counts → ALL viewers on the hospital list/detail pages see it instantly
- Live connection indicator in sidebar ("Live Updates ON")

---

## 📊 Seeded Data Included
The `schema.sql` includes:
- **8 Indian cities** (Hyderabad, Bengaluru, Mumbai, Delhi, Chennai, Pune, Kolkata, Ahmedabad)
- **10 real Hyderabad hospitals** (Apollo, KIMS, Yashoda, Osmania General, Rainbow, CARE, NIMS, Sparsh, Medicover, Continental)
- **30+ ICU wards** across all hospitals with realistic bed counts
- 1 Super Admin account

---

## 🔌 API Endpoints Summary
```
POST   /api/auth/login                           Login
GET    /api/auth/me                              Get current user
GET    /api/hospitals                            List hospitals (with filters)
GET    /api/hospitals/:id                        Hospital details + wards
GET    /api/hospitals/cities                     Get all cities
POST   /api/hospitals                            Create hospital (super_admin)
GET    /api/hospitals/:hId/wards                 Get wards
POST   /api/hospitals/:hId/wards                 Create ward + beds
PATCH  /api/hospitals/:hId/wards/:wId/bed-count  Quick update bed counts
GET    /api/wards/:wId/beds                      Get all beds in ward
PATCH  /api/wards/:wId/beds/:bId/status          Update bed status
GET    /api/hospitals/:hId/patients              List patients
POST   /api/hospitals/:hId/patients/admit        Admit patient
PATCH  /api/hospitals/:hId/patients/:pId/discharge  Discharge patient
GET    /api/dashboard/hospital/:hId?             Hospital dashboard data
GET    /api/dashboard/admin                      Super admin dashboard data
```

---

## 🛠️ Environment Variables (backend/.env)
```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=icu_bed_tracker
JWT_SECRET=icu_tracker_super_secret_jwt_key_2024
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

---

## ❓ Troubleshooting

**MySQL Connection Failed**
→ Update `DB_PASSWORD` in `backend/.env`

**Port 5000 in use (macOS)**
→ macOS AirPlay uses port 5000. Use port 5001 (already configured).

**Frontend "proxy" error**
→ Make sure backend is running before starting frontend

**Socket not connecting**
→ Both frontend and backend must be running simultaneously

---

## 👤 Developer

**Patan Shanawaz**
- GitHub: [github.com/patanshanawaz](https://github.com/patanshanawaz)

---

*BedMitra — Your Trusted Friend for Finding ICU Beds 🤝*
