require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // initializes DB + seeds on first run

const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);

// Serve the built React frontend (single-deployment setup)
// Run `npm run build` inside /frontend first — this creates frontend/dist
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(FRONTEND_DIST));

// React Router client-side routing: send all non-API GET requests to index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Exam Timetable server running on port ${PORT}`);
});
