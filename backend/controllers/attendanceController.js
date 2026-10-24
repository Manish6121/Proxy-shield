const { authenticator } = require('otplib');
const { generateAutoPentagon, isInside3DGeofence } = require('../utils/geofence');
const db = require('../models/db');

authenticator.options = { step: 15 };
const SECRET_KEY = 'PROXYSHIELD_PRODUCTION_SECRET_KEY_2026';

// 1. Get Live TOTP Passcode
exports.getLiveTOTP = (req, res) => {
  const currentDB = db.getDB();
  const code = authenticator.generate(SECRET_KEY);
  const timeRemaining = 15 - (Math.floor(Date.now() / 1000) % 15);
  const activeSession = currentDB.sessions.find(s => s.isActive) || currentDB.sessions[0];
  res.json({ code, timeRemaining, session: activeSession });
};

// 2. Faculty: Auto-Generate Geofence Session
exports.createAutoFenceSession = (req, res) => {
  const { lat, lng, alt, course, room } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: 'Faculty GPS coordinates required.' });
  }

  const geofence = generateAutoPentagon(parseFloat(lat), parseFloat(lng), parseFloat(alt || 212.0));
  const currentDB = db.getDB();

  currentDB.sessions.forEach(s => s.isActive = false);
  const newSession = {
    id: `SESS-${Date.now().toString().slice(-4)}`,
    course: course || "Cyber Security (BCA-508)",
    faculty: req.user ? req.user.name : "Prof. Akansh Verma",
    room: room || `Auto-Room (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`,
    isActive: true,
    geofence
  };

  currentDB.sessions.unshift(newSession);
  db.saveDB(currentDB);

  res.json({
    success: true,
    message: '5-Point Pentagon Geofence created successfully!',
    session: newSession
  });
};

// 3. Student: Attendance Check-In Verification
exports.studentCheckIn = (req, res) => {
  const { code, lat, lng, alt } = req.body;
  const currentDB = db.getDB();
  const activeSession = currentDB.sessions.find(s => s.isActive);

  const studentName = req.user ? req.user.name : 'Manish Kumar';
  const studentId = req.user ? req.user.identifier : '240919106125';

  if (!activeSession) {
    return res.status(400).json({ success: false, message: 'No active session initialized by faculty.' });
  }

  // A. Temporal Verification (15s Dynamic TOTP)
  const isValidCode = authenticator.check(code, SECRET_KEY);
  if (!isValidCode) {
    const incident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString(),
      student: studentName,
      studentId: studentId,
      type: 'EXPIRED_TOTP',
      ip: req.ip || '192.168.1.50'
    };
    currentDB.incidents.unshift(incident);
    db.saveDB(currentDB);
    return res.status(400).json({ success: false, message: 'Invalid or expired 15-second passcode.' });
  }

  // B. Spatial Verification (3D Geofence Ray-Casting & Elevation Check)
  const geoCheck = isInside3DGeofence(
    [parseFloat(lat), parseFloat(lng)],
    activeSession.geofence.polygon,
    alt ? parseFloat(alt) : null,
    activeSession.geofence.zMin,
    activeSession.geofence.zMax
  );

  if (!geoCheck.valid) {
    const incident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString(),
      student: studentName,
      studentId: studentId,
      type: geoCheck.reason,
      ip: req.ip || '192.168.1.50'
    };
    currentDB.incidents.unshift(incident);
    db.saveDB(currentDB);
    return res.status(403).json({ success: false, message: `Geofence Violation: ${geoCheck.reason}` });
  }

  // C. Record Attendance Ledger
  const record = {
    id: `ATT-${Date.now().toString().slice(-4)}`,
    student: studentName,
    studentId: studentId,
    course: activeSession.course,
    room: activeSession.room,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    alt: alt ? parseFloat(alt) : 'N/A',
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString()
  };

  currentDB.attendance.unshift(record);
  db.saveDB(currentDB);

  res.json({ success: true, message: 'Attendance verified and recorded successfully!', record });
};

// 4. Fetch Student Dashboard / History Data
exports.getStudentData = (req, res) => {
  const currentDB = db.getDB();
  const studentId = req.user ? req.user.identifier : '240919106125';
  const history = currentDB.attendance.filter(a => a.studentId === studentId);
  res.json({ success: true, history });
};

// 5. Fetch Faculty Command Data
exports.getFacultyData = (req, res) => {
  const currentDB = db.getDB();
  res.json({
    sessions: currentDB.sessions,
    attendance: currentDB.attendance,
    incidents: currentDB.incidents
  });
};

// 6. Reports: Export Master CSV Ledger
exports.exportCSV = (req, res) => {
  const currentDB = db.getDB();
  let csv = 'RecordID,StudentName,StudentID,Course,Room,Latitude,Longitude,Altitude,Date,Time\n';
  currentDB.attendance.forEach(r => {
    csv += `${r.id},"${r.student}",${r.studentId},"${r.course}","${r.room}",${r.lat},${r.lng},${r.alt},${r.date},${r.time}\n`;
  });
  res.header('Content-Type', 'text/csv');
  res.attachment('proxyshield_master_ledger.csv');
  res.send(csv);
};
