const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '../database.json');

function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const salt = bcrypt.genSaltSync(10);
    const initialData = {
      users: [
        {
          id: "USR-001",
          identifier: "240919106125",
          name: "Manish Kumar",
          role: "student",
          passwordHash: bcrypt.hashSync("student123", salt)
        },
        {
          id: "USR-002",
          identifier: "FAC101",
          name: "Prof. Akansh Verma",
          role: "faculty",
          passwordHash: bcrypt.hashSync("faculty123", salt)
        }
      ],
      sessions: [
        {
          id: "SESS-101",
          course: "Cyber Security (BCA-508)",
          faculty: "Prof. Akansh Verma",
          room: "Room 204 (2nd Floor)",
          isActive: true,
          geofence: {
            polygon: [
              [28.60150, 77.37120],
              [28.60160, 77.37130],
              [28.60140, 77.37150],
              [28.60120, 77.37110],
              [28.60130, 77.37100]
            ],
            zMin: 210.0,
            zMax: 214.0
          }
        }
      ],
      attendance: [],
      incidents: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function getDB() {
  initDB();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error("Error reading DB file, re-initializing:", e);
    return { users: [], sessions: [], attendance: [], incidents: [] };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { getDB, saveDB, getUsers: () => getDB().users };
