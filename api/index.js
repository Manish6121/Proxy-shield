const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('../backend/routes/authRoutes');
const attendanceRoutes = require('../backend/routes/attendanceRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes with /api prefix for both local and Vercel deployment
app.use('/api/auth', authRoutes);
app.use('/api', attendanceRoutes);

// Also mount without /api prefix so Vercel serverless routing works
// (Vercel may strip the /api prefix when routing to this function)
app.use('/auth', authRoutes);
app.use('/', attendanceRoutes);

app.use(express.static(path.join(__dirname, '../frontend')));

module.exports = app;