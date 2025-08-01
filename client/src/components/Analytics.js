import React, { useState, useEffect } from 'react';
import { getCurrentWeekAnalytics, getSymptomTrends, getDormAnalytics, getRiskLevels } from '../services/api';

function Analytics({ user }) {
  const [currentWeekData, setCurrentWeekData] = useState(null);
  const [symptomData, setSymptomData] = useState(null);
  const [dormData, setDormData] = useState(null);
  const [riskLevels, setRiskLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState(4);

  useEffect(() => {
    loadAnalyticsData();
  }, [user, selectedTimeframe]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [currentWeek, symptoms, dorm, risks] = await Promise.all([
        getCurrentWeekAnalytics(),
        getSymptomTrends(selectedTimeframe),
        getDormAnalytics(user.dormName, selectedTimeframe * 2),
        getRiskLevels()
      ]);

      setCurrentWeekData(currentWeek);
      setSymptomData(symptoms);
      setDormData(dorm);
      setRiskLevels(risks.riskLevels);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getSymptomColor = (index) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-gray-500', 'bg-orange-500', 'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadAnalyticsData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Analytics</h1>
          <p className="text-gray-600">Disease trends and community health insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Timeframe:</label>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={2}>2 weeks</option>
            <option value={4}>4 weeks</option>
            <option value={8}>8 weeks</option>
            <option value={12}>12 weeks</option>
          </select>
        </div>
      </div>

      {/* Current Week Overview */}
      {currentWeekData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">This Week's Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {currentWeekData.analytics?.reduce((sum, dorm) => sum + dorm.total_responses, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Total Responses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {currentWeekData.analytics?.reduce((sum, dorm) => sum + dorm.sick_count, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Reporting Symptoms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {currentWeekData.analytics?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Dorms Participating</div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Level Matrix */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Campus Risk Levels</h2>
        {riskLevels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskLevels.map((dorm) => (
              <div key={dorm.dorm_name} className={`border-2 rounded-lg p-4 ${getRiskLevelColor(dorm.risk_level)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm" title={dorm.dorm_name}>
                    {dorm.dorm_name.length > 25 ? `${dorm.dorm_name.substring(0, 25)}...` : dorm.dorm_name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    dorm.risk_level === 'high' ? 'bg-red-600 text-white' :
                    dorm.risk_level === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-green-600 text-white'
                  }`}>
                    {dorm.risk_level.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Sick Rate:</span>
                    <span className="font-medium">{dorm.sick_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Responses:</span>
                    <span className="font-medium">{dorm.total_responses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Score:</span>
                    <span className="font-medium">{dorm.risk_score}/100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No risk data available</p>
        )}
      </div>

      {/* Your Dorm Trends */}
      {dormData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Dorm Trends: {dormData.dormName}
          </h2>
          {dormData.weeklyData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {dormData.weeklyData[0]?.sick_percentage || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Current Sick Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {dormData.weeklyData[0]?.total_responses || 0}
                  </div>
                  <div className="text-sm text-gray-600">This Week's Responses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {dormData.weeklyData[0]?.avg_severity || 0}
                  </div>
                  <div className="text-sm text-gray-600">Avg Severity (1-5)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {dormData.weeklyData.length}
                  </div>
                  <div className="text-sm text-gray-600">Weeks of Data</div>
                </div>
              </div>
              
              {/* Weekly trend table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Responses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sick Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Severity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dormData.weeklyData.slice(0, 8).map((week) => (
                      <tr key={week.week_start}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(week.week_start).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {week.total_responses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            parseFloat(week.sick_percentage) >= 30 ? 'bg-red-100 text-red-800' :
                            parseFloat(week.sick_percentage) >= 15 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {week.sick_percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {week.avg_severity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No trend data available for your dorm</p>
          )}
        </div>
      )}

      {/* Symptom Trends */}
      {symptomData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Most Common Symptoms (Last {selectedTimeframe} weeks)
          </h2>
          {symptomData.globalSymptoms.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top symptoms list */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Top Symptoms</h3>
                  <div className="space-y-2">
                    {symptomData.globalSymptoms.slice(0, 10).map((symptom, index) => (
                      <div key={symptom.symptom} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${getSymptomColor(index)}`}></div>
                          <span className="font-medium text-gray-900">{symptom.symptom}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {symptom.count} reports
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual representation */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Symptom Distribution</h3>
                  <div className="space-y-3">
                    {symptomData.globalSymptoms.slice(0, 8).map((symptom, index) => {
                      const maxCount = symptomData.globalSymptoms[0]?.count || 1;
                      const percentage = (symptom.count / maxCount) * 100;
                      
                      return (
                        <div key={symptom.symptom}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{symptom.symptom}</span>
                            <span className="text-gray-500">{symptom.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getSymptomColor(index)}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {symptomData.totalResponses}
                    </div>
                    <div className="text-sm text-gray-600">Total Symptom Reports</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {symptomData.globalSymptoms.length}
                    </div>
                    <div className="text-sm text-gray-600">Unique Symptoms</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Object.keys(symptomData.dormSymptoms).length}
                    </div>
                    <div className="text-sm text-gray-600">Dorms Reporting</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No symptom data available</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Analytics;