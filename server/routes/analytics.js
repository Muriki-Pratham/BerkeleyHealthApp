const express = require('express');
const router = express.Router();
const { db } = require('../index');

// Get health trends for all dorms
router.get('/trends', (req, res) => {
  const { weeks = 4 } = req.query;
  
  db.all(`
    SELECT 
      ht.*,
      (SELECT COUNT(*) FROM users WHERE dorm_name = ht.dorm_name) as total_students
    FROM health_trends ht
    WHERE ht.week_start >= date('now', '-${weeks} weeks')
    ORDER BY ht.week_start DESC, ht.dorm_name
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ trends: rows });
  });
});

// Get current week analytics
router.get('/current-week', (req, res) => {
  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(weekStart.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const weekStartStr = monday.toISOString().split('T')[0];

  db.all(`
    SELECT 
      u.dorm_name,
      COUNT(*) as total_responses,
      COUNT(CASE WHEN s.severity_level >= 3 THEN 1 END) as sick_count,
      AVG(s.severity_level) as avg_severity,
      s.symptoms
    FROM surveys s
    JOIN users u ON s.user_id = u.id
    WHERE s.week_start = ?
    GROUP BY u.dorm_name
  `, [weekStartStr], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Process symptoms data
    const processedData = rows.map(row => {
      let allSymptoms = [];
      if (row.symptoms) {
        try {
          const symptoms = JSON.parse(row.symptoms);
          allSymptoms = Array.isArray(symptoms) ? symptoms : [];
        } catch (e) {
          console.error('Error parsing symptoms:', e);
        }
      }

      return {
        ...row,
        symptoms: allSymptoms,
        sick_percentage: row.total_responses > 0 ? (row.sick_count / row.total_responses * 100).toFixed(1) : 0
      };
    });

    res.json({ 
      weekStart: weekStartStr,
      analytics: processedData 
    });
  });
});

// Get symptom trends across all dorms
router.get('/symptoms', (req, res) => {
  const { weeks = 4 } = req.query;
  
  db.all(`
    SELECT 
      s.symptoms,
      s.severity_level,
      u.dorm_name,
      s.week_start
    FROM surveys s
    JOIN users u ON s.user_id = u.id
    WHERE s.week_start >= date('now', '-${weeks} weeks')
    ORDER BY s.week_start DESC
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Process and aggregate symptoms
    const symptomCounts = {};
    const dormSymptoms = {};

    rows.forEach(row => {
      try {
        const symptoms = JSON.parse(row.symptoms || '[]');
        
        symptoms.forEach(symptom => {
          // Global symptom counts
          if (!symptomCounts[symptom]) {
            symptomCounts[symptom] = 0;
          }
          symptomCounts[symptom]++;

          // Dorm-specific symptom counts
          if (!dormSymptoms[row.dorm_name]) {
            dormSymptoms[row.dorm_name] = {};
          }
          if (!dormSymptoms[row.dorm_name][symptom]) {
            dormSymptoms[row.dorm_name][symptom] = 0;
          }
          dormSymptoms[row.dorm_name][symptom]++;
        });
      } catch (e) {
        console.error('Error parsing symptoms:', e);
      }
    });

    // Sort symptoms by frequency
    const sortedSymptoms = Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([symptom, count]) => ({ symptom, count }));

    res.json({
      globalSymptoms: sortedSymptoms,
      dormSymptoms,
      totalResponses: rows.length
    });
  });
});

// Get specific dorm analytics
router.get('/dorm/:dormName', (req, res) => {
  const { dormName } = req.params;
  const { weeks = 8 } = req.query;

  db.all(`
    SELECT 
      s.week_start,
      COUNT(*) as total_responses,
      COUNT(CASE WHEN s.severity_level >= 3 THEN 1 END) as sick_count,
      AVG(s.severity_level) as avg_severity,
      GROUP_CONCAT(s.symptoms) as all_symptoms
    FROM surveys s
    JOIN users u ON s.user_id = u.id
    WHERE u.dorm_name = ? AND s.week_start >= date('now', '-${weeks} weeks')
    GROUP BY s.week_start
    ORDER BY s.week_start DESC
  `, [dormName], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const processedData = rows.map(row => {
      // Process symptoms
      let weekSymptoms = [];
      if (row.all_symptoms) {
        const symptomArrays = row.all_symptoms.split(',');
        symptomArrays.forEach(symptomsStr => {
          try {
            const symptoms = JSON.parse(symptomsStr);
            weekSymptoms = weekSymptoms.concat(symptoms);
          } catch (e) {
            console.error('Error parsing symptoms:', e);
          }
        });
      }

      return {
        week_start: row.week_start,
        total_responses: row.total_responses,
        sick_count: row.sick_count,
        avg_severity: parseFloat(row.avg_severity || 0).toFixed(2),
        sick_percentage: row.total_responses > 0 ? (row.sick_count / row.total_responses * 100).toFixed(1) : 0,
        common_symptoms: weekSymptoms
      };
    });

    res.json({
      dormName,
      weeklyData: processedData
    });
  });
});

// Get health score/risk level for dorms
router.get('/risk-levels', (req, res) => {
  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(weekStart.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const weekStartStr = monday.toISOString().split('T')[0];

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

    const riskLevels = rows.map(row => {
      const sickPercentage = row.total_responses > 0 ? (row.sick_count / row.total_responses) : 0;
      const highSeverityPercentage = row.total_responses > 0 ? (row.high_severity_count / row.total_responses) : 0;
      const avgSeverity = parseFloat(row.avg_severity || 0);

      // Calculate risk score (0-100)
      let riskScore = 0;
      riskScore += sickPercentage * 40; // 40% weight for sick percentage
      riskScore += highSeverityPercentage * 30; // 30% weight for high severity
      riskScore += (avgSeverity / 5) * 30; // 30% weight for average severity

      let riskLevel = 'low';
      if (riskScore >= 70) riskLevel = 'high';
      else if (riskScore >= 40) riskLevel = 'medium';

      return {
        dorm_name: row.dorm_name,
        total_responses: row.total_responses,
        sick_count: row.sick_count,
        sick_percentage: (sickPercentage * 100).toFixed(1),
        avg_severity: avgSeverity.toFixed(2),
        risk_score: riskScore.toFixed(1),
        risk_level: riskLevel
      };
    });

    res.json({ 
      weekStart: weekStartStr,
      riskLevels: riskLevels.sort((a, b) => parseFloat(b.risk_score) - parseFloat(a.risk_score))
    });
  });
});

module.exports = router;