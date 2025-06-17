const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Setup storage directory for uploaded files (if needed in future)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Function to save data to a JSON file (mock database)
const saveData = (data) => {
  const filePath = path.join(__dirname, 'personalinfo-data.json');
  let existing = [];

  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath));
    } catch (e) {
      console.error('Failed to read existing data:', e.message);
    }
  }

  existing.push(data);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
};

// POST route for handling personal info form submission
router.post('/api/personalinfo', upload.none(), (req, res) => {
  const { fullName, email, phone, address } = req.body;

  if (!fullName || !email || !phone || !address) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const newEntry = {
    fullName,
    email,
    phone,
    address,
    submittedAt: new Date()
  };

  try {
    saveData(newEntry);
    res.status(201).json({ message: 'Personal info saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving data', error: error.message });
  }
});

module.exports = router;
