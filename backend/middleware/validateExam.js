// Validates exam payloads against the business rules in the spec:
// - subject, year, section, exam_date, start_time, end_time are all mandatory
// - end_time must be strictly after start_time
// Runs on both create (all fields required) and update (only provided fields checked).

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM 24-hour
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;          // YYYY-MM-DD

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function validateExamCreate(req, res, next) {
  const { subject, exam_date, start_time, end_time, year, section } = req.body;
  const errors = [];

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    errors.push('Subject is required.');
  }
  if (year === undefined || year === null || year === '' || isNaN(Number(year))) {
    errors.push('Academic year is required and must be a number.');
  }
  if (!section || typeof section !== 'string' || !section.trim()) {
    errors.push('Section is required.');
  }
  if (!exam_date || !DATE_RE.test(exam_date)) {
    errors.push('Exam date is required and must be in YYYY-MM-DD format.');
  }
  if (!start_time || !TIME_RE.test(start_time)) {
    errors.push('Start time is required and must be in HH:MM format.');
  }
  if (!end_time || !TIME_RE.test(end_time)) {
    errors.push('End time is required and must be in HH:MM format.');
  }

  // Only compare times if both are individually valid, to avoid a confusing double error
  if (start_time && end_time && TIME_RE.test(start_time) && TIME_RE.test(end_time)) {
    if (timeToMinutes(end_time) <= timeToMinutes(start_time)) {
      errors.push('End time must be strictly after start time.');
    }
  }

  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

function validateExamUpdate(req, res, next) {
  // For update, fields are optional individually — only whichever fields ARE provided
  // are format-checked here. The end>start semantic check happens in the route AFTER
  // merging with the existing DB row, because changing only start_time (for example)
  // must still be validated against the current end_time.
  const { exam_date, start_time, end_time, subject, year, section } = req.body;
  const errors = [];

  if (subject !== undefined && (!subject || !String(subject).trim())) {
    errors.push('Subject cannot be empty.');
  }
  if (year !== undefined && (year === null || year === '' || isNaN(Number(year)))) {
    errors.push('Academic year must be a number.');
  }
  if (section !== undefined && (!section || !String(section).trim())) {
    errors.push('Section cannot be empty.');
  }
  if (exam_date !== undefined && !DATE_RE.test(exam_date)) {
    errors.push('Exam date must be in YYYY-MM-DD format.');
  }
  if (start_time !== undefined && !TIME_RE.test(start_time)) {
    errors.push('Start time must be in HH:MM format.');
  }
  if (end_time !== undefined && !TIME_RE.test(end_time)) {
    errors.push('End time must be in HH:MM format.');
  }

  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

module.exports = { validateExamCreate, validateExamUpdate, timeToMinutes, TIME_RE, DATE_RE };
