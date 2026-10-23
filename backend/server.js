const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', attendanceRoutes);

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../frontend')));

// Root Redirect
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/login.html'));
});

// Start server locally (ignored on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;