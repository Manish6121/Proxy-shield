const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('../backend/routes/authRoutes');
const attendanceRoutes = require('../backend/routes/attendanceRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', attendanceRoutes);

app.use(express.static(path.join(__dirname, '../frontend')));

module.exports = app;