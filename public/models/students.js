// models/students.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET: Fetch student data from personalinfo-data.json
router.get('/api/students', (req, res) => {
  const filePath = path.join(__dirname, 'personalinfo-data.json');
  if (!fs.existsSync(filePath)) {
    return res.json([]); // Return empty array if no data file exists
  }

  try {
    const data = fs.readFileSync(filePath);
    const students = JSON.parse(data);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Error reading student data', error: err.message });
  }
});

// POST: Add a new student profile
router.post('/api/students', (req, res) => {
  const newStudent = req.body;

  const filePath = path.join(__dirname, 'personalinfo-data.json');

  try {
    let students = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      students = JSON.parse(data);
    }

    students.push(newStudent);

    fs.writeFileSync(filePath, JSON.stringify(students, null, 2));

    res.status(201).json({ message: 'Student profile created successfully', student: newStudent });
  } catch (err) {
    res.status(500).json({ message: 'Error saving student data', error: err.message });
  }
});

module.exports = router;
