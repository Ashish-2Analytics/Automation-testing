require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const USE_MSSQL = process.env.USE_MSSQL === 'true';

// MSSQL Configuration
const mssqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'TemousCentralDB',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

let pool = null;
let isMssqlConnected = false;

if (USE_MSSQL) {
  sql.connect(mssqlConfig)
    .then(p => {
      pool = p;
      isMssqlConnected = true;
      console.log(`[MSSQL] Successfully connected to MS SQL Server database '${mssqlConfig.database}' on ${mssqlConfig.server}`);
      return ensureTablesExist(pool);
    })
    .catch(err => {
      console.error(`[MSSQL Connection Error] ${err.message}. Falling back to local JSON db.json.`);
      isMssqlConnected = false;
    });
}

async function ensureTablesExist(pool) {
  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
        CREATE TABLE Users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          email NVARCHAR(255) NOT NULL UNIQUE,
          password NVARCHAR(255) NOT NULL,
          name NVARCHAR(255) NOT NULL
        );
        INSERT INTO Users (email, password, name) VALUES 
        ('admin@temous.com', 'password123', 'Administrator'),
        ('test@temous.com', 'PassWord123!', 'Test User'),
        ('student@mail.temous.edu', 'password123', 'Student User');
      END;

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Students')
      BEGIN
        CREATE TABLE Students (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          regDate NVARCHAR(50),
          studentClass NVARCHAR(50),
          stream NVARCHAR(50),
          dob NVARCHAR(50),
          gender NVARCHAR(50),
          documentPath NVARCHAR(500),
          documentOriginalName NVARCHAR(255),
          photoPath NVARCHAR(500),
          photoOriginalName NVARCHAR(255),
          createdAt DATETIME DEFAULT GETDATE()
        );
      END;
    `);
    console.log('[MSSQL] Database schema tables verified.');
  } catch (err) {
    console.error('[MSSQL Schema Error]', err);
  }
}

// Local JSON file fallback helpers
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    users: [
      { id: 1, email: "admin@temous.com", password: "password123", name: "Administrator" },
      { id: 2, email: "test@temous.com", password: "PassWord123!", name: "Test User" },
      { id: 3, email: "student@mail.temous.edu", password: "password123", name: "Student User" }
    ],
    students: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading db file:", err);
    return { users: [], students: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing db file:", err);
  }
}

module.exports = {
  getUsers: async () => {
    if (isMssqlConnected && pool) {
      const res = await pool.request().query('SELECT id, email, password, name FROM Users');
      return res.recordset;
    }
    return readDB().users;
  },

  findUserByEmail: async (email) => {
    if (isMssqlConnected && pool) {
      const res = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT id, email, password, name FROM Users WHERE LOWER(email) = LOWER(@email)');
      return res.recordset[0] || null;
    }
    const db = readDB();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  findStudentByEmail: async (email) => {
    if (!email) return null;
    const cleanEmail = String(email).trim().toLowerCase();
    if (isMssqlConnected && pool) {
      const res = await pool.request()
        .input('email', sql.NVarChar, cleanEmail)
        .query('SELECT * FROM Students WHERE LOWER(TRIM(email)) = LOWER(@email)');
      return res.recordset[0] || null;
    }
    const db = readDB();
    return db.students.find(s => s.email && String(s.email).trim().toLowerCase() === cleanEmail) || null;
  },

  getStudents: async () => {
    if (isMssqlConnected && pool) {
      const res = await pool.request().query('SELECT id, name, email, regDate, studentClass AS [class], studentClass, stream, dob, gender, documentPath, documentOriginalName, photoPath, photoOriginalName, createdAt FROM Students ORDER BY id DESC');
      return res.recordset;
    }
    const dbStudents = readDB().students;
    return dbStudents.map(s => ({ ...s, class: s.class || s.studentClass }));
  },

  getStudentById: async (id) => {
    if (isMssqlConnected && pool) {
      const res = await pool.request()
        .input('id', sql.Int, parseInt(id, 10))
        .query('SELECT id, name, email, regDate, studentClass AS [class], studentClass, stream, dob, gender, documentPath, documentOriginalName, photoPath, photoOriginalName, createdAt FROM Students WHERE id = @id');
      const rec = res.recordset[0] || null;
      return rec;
    }
    const db = readDB();
    const found = db.students.find(s => s.id === parseInt(id, 10));
    return found ? { ...found, class: found.class || found.studentClass } : null;
  },

  saveStudent: async (studentData) => {
    const cleanEmail = studentData.email ? String(studentData.email).trim() : '';
    if (cleanEmail) {
      const existing = await module.exports.findStudentByEmail(cleanEmail);
      if (existing) {
        throw new Error('This email ID has already been registered. Please use a unique email ID.');
      }
    }

    if (isMssqlConnected && pool) {
      const res = await pool.request()
        .input('name', sql.NVarChar, studentData.name)
        .input('email', sql.NVarChar, cleanEmail || null)
        .input('regDate', sql.NVarChar, studentData.regDate)
        .input('studentClass', sql.NVarChar, studentData.class)
        .input('stream', sql.NVarChar, studentData.stream)
        .input('dob', sql.NVarChar, studentData.dob)
        .input('gender', sql.NVarChar, studentData.gender)
        .input('documentPath', sql.NVarChar, studentData.documentPath || null)
        .input('documentOriginalName', sql.NVarChar, studentData.documentOriginalName || null)
        .input('photoPath', sql.NVarChar, studentData.photoPath || null)
        .input('photoOriginalName', sql.NVarChar, studentData.photoOriginalName || null)
        .query(`
          INSERT INTO Students (name, email, regDate, studentClass, stream, dob, gender, documentPath, documentOriginalName, photoPath, photoOriginalName)
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.regDate, INSERTED.studentClass AS [class], INSERTED.studentClass, INSERTED.stream, INSERTED.dob, INSERTED.gender, INSERTED.documentPath, INSERTED.documentOriginalName, INSERTED.photoPath, INSERTED.photoOriginalName, INSERTED.createdAt
          VALUES (@name, @email, @regDate, @studentClass, @stream, @dob, @gender, @documentPath, @documentOriginalName, @photoPath, @photoOriginalName)
        `);
      return res.recordset[0];
    }

    const db = readDB();
    const newId = db.students.length > 0 ? Math.max(...db.students.map(s => s.id)) + 1 : 1;
    const record = {
      id: newId,
      ...studentData,
      email: cleanEmail,
      createdAt: new Date().toISOString()
    };
    db.students.push(record);
    writeDB(db);
    return record;
  }
};
