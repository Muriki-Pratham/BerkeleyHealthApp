const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('./health_data.db');

// Initialize database tables
db.serialize(() => {
  // Users table for anonymous tracking
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anonymous_id TEXT UNIQUE,
    dorm_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Weekly surveys table
  db.run(`CREATE TABLE IF NOT EXISTS surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    week_start DATE,
    symptoms TEXT, -- JSON string of symptoms
    severity_level INTEGER, -- 1-5 scale
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Health trends table for AI analysis
  db.run(`CREATE TABLE IF NOT EXISTS health_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start DATE,
    dorm_name TEXT,
    total_responses INTEGER,
    sick_count INTEGER,
    common_symptoms TEXT, -- JSON string
    trend_score REAL,
    analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dorm_name TEXT,
    message TEXT,
    severity TEXT, -- low, medium, high
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT 1
  )`);
});

// Import routes
const surveyRoutes = require('./routes/surveys');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');

// API Routes
app.use('/api/surveys', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Weekly analysis cron job (runs every Sunday at midnight)
cron.schedule('0 0 * * 0', () => {
  console.log('Running weekly health trend analysis...');
  require('./services/aiAnalysis').runWeeklyAnalysis();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, db };