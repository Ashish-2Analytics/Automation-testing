require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads setup
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static frontend files and uploads
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// API Routes

// 1. Authentication
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await db.findUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Try admin@temous.com / password123' });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Submit Student Form with Document and Photo Uploads
const uploadFields = upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);

app.post('/api/students', (req, res) => {
  uploadFields(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { name, email, regDate, studentClass, stream, dob, gender, isBugMode } = req.body;

    // Backend validation
    if (!name || !email || !regDate || !studentClass || !stream || !dob || !gender) {
      return res.status(400).json({ success: false, message: 'All student details fields are required.' });
    }

    // Bug 5 trigger check on backend if requested or invalid file uploaded
    const docFile = req.files && req.files['document'] ? req.files['document'][0] : null;
    const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : null;

    if (isBugMode === 'true' && docFile && (docFile.originalname.endsWith('.exe') || docFile.originalname.endsWith('.bat'))) {
      return res.status(400).json({
        success: false,
        message: 'Security error: Executable files are strictly forbidden.'
      });
    }

    try {
      // Check for duplicate student email
      const existingStudent = await db.findStudentByEmail(email);
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'This email ID has already been registered. Please use a unique email ID.'
        });
      }

      const newStudent = await db.saveStudent({
        name,
        email,
        regDate,
        class: studentClass,
        stream,
        dob,
        gender,
        documentPath: docFile ? `/uploads/${docFile.filename}` : null,
        documentOriginalName: docFile ? docFile.originalname : null,
        photoPath: photoFile ? `/uploads/${photoFile.filename}` : null,
        photoOriginalName: photoFile ? photoFile.originalname : null
      });

      return res.status(201).json({
        success: true,
        message: 'Student record saved successfully!',
        student: newStudent
      });
    } catch (dbErr) {
      return res.status(500).json({ success: false, message: dbErr.message });
    }
  });
});

// 3. Get All Saved Records
app.get('/api/students', async (req, res) => {
  try {
    const students = await db.getStudents();
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Get Student Record by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Temous Central Server running on http://localhost:${PORT}`);
  console.log(`=================================================`);
});
