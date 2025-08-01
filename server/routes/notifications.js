const express = require('express');
const router = express.Router();
const { db } = require('../index');

// Get active notifications for a specific dorm
router.get('/:dormName', (req, res) => {
  const { dormName } = req.params;

  db.all(
    'SELECT * FROM notifications WHERE (dorm_name = ? OR dorm_name = "all") AND active = 1 ORDER BY created_at DESC',
    [dormName],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ notifications: rows });
    }
  );
});

// Get all active notifications
router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM notifications WHERE active = 1 ORDER BY created_at DESC',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ notifications: rows });
    }
  );
});

// Create a new notification
router.post('/', (req, res) => {
  const { dormName, message, severity } = req.body;

  if (!dormName || !message || !severity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['low', 'medium', 'high'].includes(severity)) {
    return res.status(400).json({ error: 'Severity must be low, medium, or high' });
  }

  db.run(
    'INSERT INTO notifications (dorm_name, message, severity) VALUES (?, ?, ?)',
    [dormName, message, severity],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        message: 'Notification created successfully',
        notificationId: this.lastID 
      });
    }
  );
});

// Deactivate a notification
router.put('/:id/deactivate', (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE notifications SET active = 0 WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ message: 'Notification deactivated successfully' });
    }
  );
});

// Generate automatic health alerts based on risk levels
router.post('/generate-alerts', (req, res) => {
  // Get current week start
  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(weekStart.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const weekStartStr = monday.toISOString().split('T')[0];

  // Get risk levels for all dorms
  db.all(`
    SELECT 
      u.dorm_name,
      COUNT(*) as total_responses,
      COUNT(CASE WHEN s.severity_level >= 4 THEN 1 END) as high_severity_count,
      COUNT(CASE WHEN s.severity_level >= 3 THEN 1 END) as sick_count,
      AVG(s.severity_level) as avg_severity
    FROM surveys s
    JOIN users u ON s.user_id = u.id
    WHERE s.week_start = ?
    GROUP BY u.dorm_name
  `, [weekStartStr], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const alertsGenerated = [];

    rows.forEach(row => {
      const sickPercentage = row.total_responses > 0 ? (row.sick_count / row.total_responses) : 0;
      const highSeverityPercentage = row.total_responses > 0 ? (row.high_severity_count / row.total_responses) : 0;
      const avgSeverity = parseFloat(row.avg_severity || 0);

      // Calculate risk score
      let riskScore = 0;
      riskScore += sickPercentage * 40;
      riskScore += highSeverityPercentage * 30;
      riskScore += (avgSeverity / 5) * 30;

      let message = '';
      let severity = 'low';

      if (riskScore >= 70) {
        severity = 'high';
        message = `⚠️ HIGH HEALTH ALERT: ${row.dorm_name} is experiencing elevated illness levels (${(sickPercentage * 100).toFixed(1)}% reporting symptoms). Consider staying indoors, wearing masks, and avoiding common areas when possible.`;
      } else if (riskScore >= 40) {
        severity = 'medium';
        message = `⚡ HEALTH NOTICE: ${row.dorm_name} has moderate illness activity (${(sickPercentage * 100).toFixed(1)}% reporting symptoms). Practice good hygiene and monitor your health closely.`;
      } else if (sickPercentage >= 0.15) { // 15% threshold for low alerts
        severity = 'low';
        message = `📋 Health Update: ${row.dorm_name} has some illness activity (${(sickPercentage * 100).toFixed(1)}% reporting symptoms). Continue practicing preventive measures.`;
      }

      if (message) {
        db.run(
          'INSERT INTO notifications (dorm_name, message, severity) VALUES (?, ?, ?)',
          [row.dorm_name, message, severity],
          function(err) {
            if (!err) {
              alertsGenerated.push({
                dorm: row.dorm_name,
                severity,
                riskScore: riskScore.toFixed(1)
              });
            }
          }
        );
      }
    });

    // Wait a bit for all inserts to complete
    setTimeout(() => {
      res.json({ 
        message: 'Health alerts generated successfully',
        alertsGenerated 
      });
    }, 500);
  });
});

// Get notification statistics
router.get('/stats/overview', (req, res) => {
  db.all(`
    SELECT 
      severity,
      COUNT(*) as count,
      COUNT(CASE WHEN active = 1 THEN 1 END) as active_count
    FROM notifications
    WHERE created_at >= date('now', '-7 days')
    GROUP BY severity
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const stats = {
      total: 0,
      active: 0,
      by_severity: {}
    };

    rows.forEach(row => {
      stats.total += row.count;
      stats.active += row.active_count;
      stats.by_severity[row.severity] = {
        total: row.count,
        active: row.active_count
      };
    });

    res.json({ stats });
  });
});

module.exports = router;