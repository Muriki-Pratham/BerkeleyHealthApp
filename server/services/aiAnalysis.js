const { db } = require('../index');
const ss = require('simple-statistics');

class HealthAnalysisService {
  constructor() {
    this.symptomCategories = {
      'respiratory': ['cough', 'sore throat', 'runny nose', 'congestion', 'shortness of breath'],
      'gastrointestinal': ['nausea', 'vomiting', 'diarrhea', 'stomach pain', 'loss of appetite'],
      'systemic': ['fever', 'chills', 'fatigue', 'body aches', 'headache'],
      'other': ['rash', 'dizziness', 'insomnia', 'anxiety']
    };
  }

  // Main weekly analysis function
  runWeeklyAnalysis() {
    console.log('Starting weekly health trend analysis...');
    
    // Get current week start
    const weekStart = this.getCurrentWeekStart();
    
    // Analyze each dorm
    this.analyzeDormTrends(weekStart);
    
    // Generate predictive insights
    this.generatePredictions(weekStart);
    
    // Auto-generate notifications if needed
    this.autoGenerateNotifications(weekStart);
  }

  getCurrentWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  }

  analyzeDormTrends(weekStart) {
    return new Promise((resolve, reject) => {
      // Get survey data for current week grouped by dorm
      db.all(`
        SELECT 
          u.dorm_name,
          COUNT(*) as total_responses,
          COUNT(CASE WHEN s.severity_level >= 3 THEN 1 END) as sick_count,
          AVG(s.severity_level) as avg_severity,
          GROUP_CONCAT(s.symptoms) as all_symptoms
        FROM surveys s
        JOIN users u ON s.user_id = u.id
        WHERE s.week_start = ?
        GROUP BY u.dorm_name
      `, [weekStart], (err, rows) => {
        if (err) {
          console.error('Error analyzing dorm trends:', err);
          return reject(err);
        }

        rows.forEach(row => {
          // Process symptoms
          const symptomAnalysis = this.analyzeSymptoms(row.all_symptoms);
          
          // Calculate trend score
          const trendScore = this.calculateTrendScore({
            totalResponses: row.total_responses,
            sickCount: row.sick_count,
            avgSeverity: row.avg_severity,
            symptomAnalysis
          });

          // Store analysis results
          db.run(`
            INSERT OR REPLACE INTO health_trends 
            (week_start, dorm_name, total_responses, sick_count, common_symptoms, trend_score)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            weekStart,
            row.dorm_name,
            row.total_responses,
            row.sick_count,
            JSON.stringify(symptomAnalysis.topSymptoms),
            trendScore
          ], (err) => {
            if (err) {
              console.error('Error storing trend analysis:', err);
            } else {
              console.log(`Analyzed trends for ${row.dorm_name}: score ${trendScore.toFixed(2)}`);
            }
          });
        });

        resolve();
      });
    });
  }

  analyzeSymptoms(allSymptomsStr) {
    const symptomCounts = {};
    const categoryScores = {
      respiratory: 0,
      gastrointestinal: 0,
      systemic: 0,
      other: 0
    };

    if (allSymptomsStr) {
      const symptomArrays = allSymptomsStr.split(',');
      
      symptomArrays.forEach(symptomsStr => {
        try {
          const symptoms = JSON.parse(symptomsStr);
          
          symptoms.forEach(symptom => {
            const lowerSymptom = symptom.toLowerCase();
            
            // Count individual symptoms
            if (!symptomCounts[lowerSymptom]) {
              symptomCounts[lowerSymptom] = 0;
            }
            symptomCounts[lowerSymptom]++;

            // Categorize symptoms
            for (const [category, categorySymptoms] of Object.entries(this.symptomCategories)) {
              if (categorySymptoms.some(catSymptom => lowerSymptom.includes(catSymptom))) {
                categoryScores[category]++;
                break;
              }
            }
          });
        } catch (e) {
          console.error('Error parsing symptoms in analysis:', e);
        }
      });
    }

    // Get top symptoms
    const topSymptoms = Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));

    // Determine dominant category
    const dominantCategory = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      topSymptoms,
      categoryScores,
      dominantCategory,
      totalSymptomReports: Object.values(symptomCounts).reduce((a, b) => a + b, 0)
    };
  }

  calculateTrendScore(data) {
    const { totalResponses, sickCount, avgSeverity, symptomAnalysis } = data;
    
    if (totalResponses === 0) return 0;

    // Base score from sick percentage (0-40 points)
    const sickPercentage = sickCount / totalResponses;
    let score = sickPercentage * 40;

    // Severity factor (0-30 points)
    const severityFactor = (avgSeverity / 5) * 30;
    score += severityFactor;

    // Symptom diversity factor (0-20 points)
    const symptomDiversity = Math.min(symptomAnalysis.topSymptoms.length / 5, 1) * 20;
    score += symptomDiversity;

    // Category concentration penalty (0-10 points)
    const totalCategoryReports = Object.values(symptomAnalysis.categoryScores).reduce((a, b) => a + b, 0);
    if (totalCategoryReports > 0) {
      const maxCategoryScore = Math.max(...Object.values(symptomAnalysis.categoryScores));
      const concentrationRatio = maxCategoryScore / totalCategoryReports;
      if (concentrationRatio > 0.7) { // High concentration in one category
        score += 10; // This indicates a potential outbreak
      }
    }

    return Math.min(score, 100); // Cap at 100
  }

  generatePredictions(weekStart) {
    return new Promise((resolve, reject) => {
      // Get historical data for trend analysis
      db.all(`
        SELECT 
          dorm_name,
          week_start,
          trend_score,
          sick_count,
          total_responses
        FROM health_trends
        WHERE week_start >= date(?, '-8 weeks')
        ORDER BY dorm_name, week_start
      `, [weekStart], (err, rows) => {
        if (err) {
          console.error('Error generating predictions:', err);
          return reject(err);
        }

        // Group by dorm
        const dormData = {};
        rows.forEach(row => {
          if (!dormData[row.dorm_name]) {
            dormData[row.dorm_name] = [];
          }
          dormData[row.dorm_name].push({
            week: row.week_start,
            score: row.trend_score,
            sickRate: row.total_responses > 0 ? row.sick_count / row.total_responses : 0
          });
        });

        // Generate predictions for each dorm
        Object.entries(dormData).forEach(([dormName, data]) => {
          if (data.length >= 3) { // Need at least 3 data points
            const prediction = this.predictNextWeekTrend(data);
            console.log(`Prediction for ${dormName}: ${prediction.direction} (confidence: ${prediction.confidence}%)`);
          }
        });

        resolve();
      });
    });
  }

  predictNextWeekTrend(historicalData) {
    // Simple trend analysis using linear regression
    const scores = historicalData.map(d => d.score);
    const weeks = historicalData.map((d, i) => i);

    if (scores.length < 2) {
      return { direction: 'stable', confidence: 0 };
    }

    try {
      const regression = ss.linearRegression(weeks.map((week, i) => [week, scores[i]]));
      const slope = regression.m;
      const rSquared = ss.rSquared(weeks.map((week, i) => [week, scores[i]]), regression);

      let direction = 'stable';
      if (slope > 2) direction = 'increasing';
      else if (slope < -2) direction = 'decreasing';

      const confidence = Math.round(rSquared * 100);

      return { direction, confidence, slope, nextWeekPrediction: regression.m * weeks.length + regression.b };
    } catch (error) {
      console.error('Error in trend prediction:', error);
      return { direction: 'stable', confidence: 0 };
    }
  }

  autoGenerateNotifications(weekStart) {
    // Get high-risk dorms for automatic notifications
    db.all(`
      SELECT * FROM health_trends
      WHERE week_start = ? AND trend_score >= 40
      ORDER BY trend_score DESC
    `, [weekStart], (err, rows) => {
      if (err) {
        console.error('Error generating auto notifications:', err);
        return;
      }

      rows.forEach(row => {
        let severity = 'medium';
        let message = '';

        if (row.trend_score >= 70) {
          severity = 'high';
          message = `🚨 HEALTH ALERT: ${row.dorm_name} shows high illness activity. Take extra precautions and consider limiting social gatherings.`;
        } else if (row.trend_score >= 55) {
          severity = 'medium';
          message = `⚠️ Health Advisory: ${row.dorm_name} has elevated illness levels. Practice good hygiene and monitor symptoms closely.`;
        } else {
          severity = 'low';
          message = `📢 Health Notice: ${row.dorm_name} showing increased illness activity. Stay vigilant with preventive measures.`;
        }

        // Check if similar notification already exists for this week
        db.get(`
          SELECT * FROM notifications 
          WHERE dorm_name = ? AND created_at >= date('now', '-7 days') AND active = 1
        `, [row.dorm_name], (err, existingNotification) => {
          if (err || existingNotification) return; // Skip if error or notification exists

          // Create notification
          db.run(`
            INSERT INTO notifications (dorm_name, message, severity) VALUES (?, ?, ?)
          `, [row.dorm_name, message, severity], (err) => {
            if (!err) {
              console.log(`Auto-generated ${severity} notification for ${row.dorm_name}`);
            }
          });
        });
      });
    });
  }

  // Manual analysis trigger for testing
  analyzeCurrentWeek() {
    const weekStart = this.getCurrentWeekStart();
    return this.analyzeDormTrends(weekStart);
  }

  // Get health insights for a specific dorm
  getDormInsights(dormName, weeks = 4) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM health_trends
        WHERE dorm_name = ? AND week_start >= date('now', '-${weeks} weeks')
        ORDER BY week_start DESC
      `, [dormName], (err, rows) => {
        if (err) return reject(err);

        const insights = {
          dormName,
          currentTrend: rows[0] || null,
          averageScore: rows.length > 0 ? ss.mean(rows.map(r => r.trend_score)) : 0,
          trendDirection: this.calculateTrendDirection(rows),
          riskLevel: this.assessRiskLevel(rows[0]?.trend_score || 0)
        };

        resolve(insights);
      });
    });
  }

  calculateTrendDirection(trends) {
    if (trends.length < 2) return 'insufficient_data';
    
    const recent = trends.slice(0, 2);
    const diff = recent[0].trend_score - recent[1].trend_score;
    
    if (diff > 5) return 'increasing';
    if (diff < -5) return 'decreasing';
    return 'stable';
  }

  assessRiskLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}

module.exports = new HealthAnalysisService();