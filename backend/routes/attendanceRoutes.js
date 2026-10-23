const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyTokenMiddleware } = require('../controllers/authController');

// Public route for projector modal / TOTP sync
router.get('/totp', attendanceController.getLiveTOTP);

// Protected Student Routes
router.post('/student/checkin', verifyTokenMiddleware, attendanceController.studentCheckIn);
router.get('/student/history', verifyTokenMiddleware, attendanceController.getStudentData);

// Protected Faculty Routes
router.post('/faculty/auto-fence', verifyTokenMiddleware, attendanceController.createAutoFenceSession);
router.get('/faculty/data', verifyTokenMiddleware, attendanceController.getFacultyData);

// Reports
router.get('/reports/csv', attendanceController.exportCSV);

module.exports = router;
