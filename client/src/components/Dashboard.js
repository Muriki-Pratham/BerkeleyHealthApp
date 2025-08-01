import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentWeekAnalytics, getRiskLevels, getNotifications } from '../services/api';

function Dashboard({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [riskLevels, setRiskLevels] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsData, riskData, notificationData] = await Promise.all([
        getCurrentWeekAnalytics(),
        getRiskLevels(),
        getNotifications(user.dormName)
      ]);

      setAnalytics(analyticsData);
      setRiskLevels(riskData.riskLevels);
      setNotifications(notificationData.notifications.slice(0, 3)); // Show top 3
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getUserDormData = () => {
    if (!analytics?.analytics) return null;
    return analytics.analytics.find(dorm => dorm.dorm_name === user.dormName);
  };

  const getHealthStatus = (sickPercentage) => {
    if (sickPercentage >= 30) return { status: 'High Risk', color: 'text-red-600', bg: 'bg-red-50' };
    if (sickPercentage >= 15) return { status: 'Moderate Risk', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const userDormData = getUserDormData();
  const healthStatus = userDormData ? getHealthStatus(parseFloat(userDormData.sick_percentage)) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Dashboard</h1>
        <p className="text-gray-600">Your community health overview for this week</p>
      </div>

      {/* Your Dorm Status */}
      {userDormData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Dorm: {user.dormName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userDormData.total_responses}</div>
              <div className="text-sm text-gray-600">Survey Responses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userDormData.sick_percentage}%</div>
              <div className="text-sm text-gray-600">Reporting Symptoms</div>
            </div>
            <div className="text-center">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${healthStatus.color} ${healthStatus.bg}`}>
                {healthStatus.status}
              </div>
              <div className="text-sm text-gray-600 mt-1">Health Status</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Health Alerts */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Health Alerts</h2>
            <Link to="/notifications" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : notification.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${
                    notification.severity === 'high'
                      ? 'text-red-600'
                      : notification.severity === 'medium'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campus-wide Risk Levels */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Campus Risk Levels</h2>
          <Link to="/analytics" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View Analytics
          </Link>
        </div>
        
        {riskLevels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskLevels.slice(0, 6).map((dorm) => (
              <div key={dorm.dorm_name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm truncate" title={dorm.dorm_name}>
                    {dorm.dorm_name.length > 20 ? `${dorm.dorm_name.substring(0, 20)}...` : dorm.dorm_name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(dorm.risk_level)}`}>
                    {dorm.risk_level.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>{dorm.sick_percentage}% reporting symptoms</div>
                  <div>{dorm.total_responses} responses</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No risk data available for this week</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/survey"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Weekly Survey</div>
              <div className="text-sm text-gray-600">Update your health status</div>
            </div>
          </Link>

          <Link
            to="/analytics"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">View Analytics</div>
              <div className="text-sm text-gray-600">Explore health trends</div>
            </div>
          </Link>

          <Link
            to="/notifications"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-yellow-100 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Health Alerts</div>
              <div className="text-sm text-gray-600">View all notifications</div>
            </div>
          </Link>

          <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Health Resources</div>
              <div className="text-sm text-gray-600">Coming soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;