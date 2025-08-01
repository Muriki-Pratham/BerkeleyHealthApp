const express = require('express');
const router = express.Router();
const { db } = require('../index');
const crypto = require('crypto');

// Get current week start date (Monday)
function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

// Generate anonymous user ID
function generateAnonymousId() {
  return crypto.randomBytes(16).toString('hex');
}

// Create or get anonymous user
router.post('/user', (req, res) => {
  const { dormName } = req.body;
  const anonymousId = generateAnonymousId();

  db.run(
    'INSERT INTO users (anonymous_id, dorm_name) VALUES (?, ?)',
    [anonymousId, dormName],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        userId: this.lastID, 
        anonymousId,
        message: 'User created successfully' 
      });
    }
  );
});

// Check if user has submitted survey for current week
router.get('/check/:userId', (req, res) => {
  const { userId } = req.params;
  const weekStart = getCurrentWeekStart();

  db.get(
    'SELECT * FROM surveys WHERE user_id = ? AND week_start = ?',
    [userId, weekStart],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ hasSubmitted: !!row, weekStart });
    }
  );
});

// Submit weekly health survey
router.post('/submit', (req, res) => {
  const { userId, symptoms, severityLevel } = req.body;
  const weekStart = getCurrentWeekStart();

  // Validate input
  if (!userId || !symptoms || !severityLevel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (severityLevel < 1 || severityLevel > 5) {
    return res.status(400).json({ error: 'Severity level must be between 1 and 5' });
  }

  // Check if already submitted this week
  db.get(
    'SELECT * FROM surveys WHERE user_id = ? AND week_start = ?',
    [userId, weekStart],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (row) {
        return res.status(400).json({ error: 'Survey already submitted for this week' });
      }

      // Insert new survey
      db.run(
        'INSERT INTO surveys (user_id, week_start, symptoms, severity_level) VALUES (?, ?, ?, ?)',
        [userId, weekStart, JSON.stringify(symptoms), severityLevel],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ 
            message: 'Survey submitted successfully',
            surveyId: this.lastID 
          });
        }
      );
    }
  );
});

// Get survey statistics for current week
router.get('/stats', (req, res) => {
  const weekStart = getCurrentWeekStart();

  db.all(`
    SELECT 
      u.dorm_name,
      COUNT(*) as total_responses,
      COUNT(CASE WHEN s.severity_level >= 3 THEN 1 END) as sick_count,
      AVG(s.severity_level) as avg_severity
    FROM surveys s
    JOIN users u ON s.user_id = u.id
    WHERE s.week_start = ?
    GROUP BY u.dorm_name
  `, [weekStart], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ weekStart, stats: rows });
  });
});

module.exports = router;