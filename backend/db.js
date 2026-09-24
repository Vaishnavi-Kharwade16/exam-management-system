const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'exam_timetable.db'));
db.pragma('journal_mode = WAL');

// ---------- SCHEMA ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','student')),
    name TEXT NOT NULL,
    year INTEGER,           -- NULL for admin, required for student
    section TEXT            -- NULL for admin, required for student
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    exam_date TEXT NOT NULL,    -- YYYY-MM-DD
    start_time TEXT NOT NULL,   -- HH:MM (24h)
    end_time TEXT NOT NULL,     -- HH:MM (24h), must be strictly after start_time
    year INTEGER NOT NULL,
    section TEXT NOT NULL,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

// ---------- SEED (only if empty) ----------
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;

if (userCount === 0) {
  const insertUser = db.prepare(
    `INSERT INTO users (username, email, password, role, name, year, section) VALUES (?,?,?,?,?,?,?)`
  );

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  insertUser.run('admin', 'admin@college.edu', hash('admin123'), 'admin', 'Admin User', null, null);
  insertUser.run('student1', 'riya.sharma@college.edu', hash('student123'), 'student', 'Riya Sharma', 1, 'A');
  insertUser.run('student2', 'arjun.mehta@college.edu', hash('student123'), 'student', 'Arjun Mehta', 1, 'B');
  insertUser.run('student3', 'kabir.singh@college.edu', hash('student123'), 'student', 'Kabir Singh', 2, 'A');
  // Edge-case seed: a student whose profile is missing a section (simulates incomplete profile)
  insertUser.run('student4', 'incomplete.profile@college.edu', hash('student123'), 'student', 'Incomplete Profile', 2, null);

  console.log('Seeded default users:');
  console.log('  admin    / admin123   (role: admin)');
  console.log('  student1 / student123 (Year 1, Section A)');
  console.log('  student2 / student123 (Year 1, Section B)');
  console.log('  student3 / student123 (Year 2, Section A)');
  console.log('  student4 / student123 (Year 2, Section MISSING - edge case demo)');
}

module.exports = db;
