const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateExamCreate, validateExamUpdate, timeToMinutes } = require('../middleware/validateExam');

const router = express.Router();

// GET /api/exams
// Admin -> all exams.
// Student -> ONLY exams matching student.year && student.section, read strictly from the
// authenticated JWT payload (req.user), never from query params. This means a student
// cannot manipulate ?year=&section= in the URL to see another section's exams — those
// query params are simply ignored server-side for the student role.
router.get('/', authenticate, (req, res) => {
  const { role, year, section } = req.user;

  if (role === 'admin') {
    const exams = db.prepare('SELECT * FROM exams ORDER BY exam_date, start_time').all();
    return res.json(exams);
  }

  // Edge case: student profile missing academic year or section (incomplete profile).
  // Fail safely with a clear 409 rather than silently returning all/no exams.
  if (year === null || year === undefined || !section) {
    return res.status(409).json({
      error: 'Your student profile is missing an academic year or section. Contact administration to update your profile before viewing exams.'
    });
  }

  const exams = db
    .prepare('SELECT * FROM exams WHERE year = ? AND section = ? ORDER BY exam_date, start_time')
    .all(year, section);

  // Edge case: no exams exist for this section yet -> returns [] (200), not an error.
  res.json(exams);
});

// POST /api/exams  (admin only)
router.post('/', authenticate, requireAdmin, validateExamCreate, (req, res) => {
  const { subject, exam_date, start_time, end_time, year, section } = req.body;

  const stmt = db.prepare(
    `INSERT INTO exams (subject, exam_date, start_time, end_time, year, section, created_by)
     VALUES (?,?,?,?,?,?,?)`
  );
  const result = stmt.run(
    subject.trim(),
    exam_date,
    start_time,
    end_time,
    Number(year),
    section.trim(),
    req.user.id
  );

  const newExam = db.prepare('SELECT * FROM exams WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newExam);
});

// PUT /api/exams/:id  (admin only)
router.put('/:id', authenticate, requireAdmin, validateExamUpdate, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM exams WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Exam not found' });

  const merged = {
    subject: req.body.subject !== undefined ? req.body.subject.trim() : existing.subject,
    exam_date: req.body.exam_date !== undefined ? req.body.exam_date : existing.exam_date,
    start_time: req.body.start_time !== undefined ? req.body.start_time : existing.start_time,
    end_time: req.body.end_time !== undefined ? req.body.end_time : existing.end_time,
    year: req.body.year !== undefined ? Number(req.body.year) : existing.year,
    section: req.body.section !== undefined ? req.body.section.trim() : existing.section
  };

  // Semantic check runs AFTER merging, so a partial update (e.g. only start_time changed)
  // is still validated against the resulting full record.
  if (timeToMinutes(merged.end_time) <= timeToMinutes(merged.start_time)) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['End time must be strictly after start time.']
    });
  }

  db.prepare(
    `UPDATE exams SET subject=?, exam_date=?, start_time=?, end_time=?, year=?, section=? WHERE id=?`
  ).run(merged.subject, merged.exam_date, merged.start_time, merged.end_time, merged.year, merged.section, id);

  const updated = db.prepare('SELECT * FROM exams WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/exams/:id  (admin only) — cancels/removes an exam record
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM exams WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Exam not found' });

  db.prepare('DELETE FROM exams WHERE id = ?').run(id);
  res.json({ message: 'Exam cancelled successfully' });
});

module.exports = router;
