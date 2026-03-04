
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/db');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET','POST','PUT','PATCH','DELETE'] }
});

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 500 }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { req.io = io; next(); });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/hospitals/:hospitalId/wards', require('./routes/wards'));
app.use('/api/wards/:wardId/beds', require('./routes/beds'));
app.use('/api/hospitals/:hospitalId/patients', require('./routes/patients'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'BedMitra API Running', time: new Date() }));
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ success: false, message: 'Internal server error.' }); });

socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`\n🚀  BedMitra Backend  →  http://localhost:${PORT}`);
  await testConnection();
  console.log(`✅  All systems ready!\n`);
});
module.exports = { app, io };
