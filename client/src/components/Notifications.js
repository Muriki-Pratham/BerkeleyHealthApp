import React, { useState, useEffect } from 'react';
import { getNotifications, getAllNotifications, deactivateNotification } from '../services/api';

function Notifications({ user }) {
  const [userNotifications, setUserNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('user'); // 'user' or 'all'

  useEffect(() => {
    loadNotifications();
  }, [user, viewMode]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      if (viewMode === 'user') {
        const userNotifs = await getNotifications(user.dormName);
        setUserNotifications(userNotifs.notifications);
      } else {
        const allNotifs = await getAllNotifications();
        setAllNotifications(allNotifs.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (notificationId) => {
    try {
      await deactivateNotification(notificationId);
      // Refresh notifications
      loadNotifications();
    } catch (error) {
      console.error('Error deactivating notification:', error);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return (
          <div className="bg-red-100 p-2 rounded-full">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'medium':
        return (
          <div className="bg-yellow-100 p-2 rounded-full">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  const getHealthTips = (severity) => {
    switch (severity) {
      case 'high':
        return [
          'Consider staying indoors when possible',
          'Wear a mask in common areas',
          'Avoid large gatherings',
          'Practice frequent hand washing',
          'Monitor your symptoms closely',
          'Contact health services if you feel unwell'
        ];
      case 'medium':
        return [
          'Practice good hygiene habits',
          'Get adequate sleep and nutrition',
          'Limit close contact with others when possible',
          'Stay hydrated',
          'Monitor for any symptoms'
        ];
      default:
        return [
          'Continue regular health practices',
          'Maintain good hygiene',
          'Stay active and eat well',
          'Keep up with preventive measures'
        ];
    }
  };

  const currentNotifications = viewMode === 'user' ? userNotifications : allNotifications;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadNotifications}
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
          <h1 className="text-3xl font-bold text-gray-900">Health Alerts</h1>
          <p className="text-gray-600">Stay informed about health trends and recommendations</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('user')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Your Dorm
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Campus
          </button>
        </div>
      </div>

      {/* Active Notifications */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {viewMode === 'user' ? `Alerts for ${user.dormName}` : 'Campus-wide Alerts'}
        </h2>
        
        {currentNotifications.length > 0 ? (
          <div className="space-y-4">
            {currentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-2 rounded-lg p-6 ${getSeverityColor(notification.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {getSeverityIcon(notification.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${getSeverityBadge(notification.severity)}`}>
                          {notification.severity.toUpperCase()}
                        </span>
                        {viewMode === 'all' && (
                          <span className="text-sm text-gray-600">
                            {notification.dorm_name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 mb-3">{notification.message}</p>
                      <div className="text-sm text-gray-600">
                        <p>Posted: {new Date(notification.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Deactivate button - only show for user's dorm notifications */}
                  {viewMode === 'user' && (
                    <button
                      onClick={() => handleDeactivate(notification.id)}
                      className="text-gray-400 hover:text-gray-600 ml-4"
                      title="Dismiss notification"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Health Tips */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommended Actions:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {getHealthTips(notification.severity).map((tip, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
            <p className="text-gray-600">
              {viewMode === 'user' 
                ? `No health alerts for ${user.dormName} at this time.`
                : 'No campus-wide health alerts at this time.'
              }
            </p>
            <p className="text-sm text-gray-500 mt-2">Keep up the good work staying healthy!</p>
          </div>
        )}
      </div>

      {/* Health Resources */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0v-9a1 1 0 00-1-1H9a1 1 0 00-1 1v9m1 0h4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Campus Health Center</h3>
            <p className="text-sm text-gray-600">Visit the health center for medical care and consultations.</p>
          </div>

          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">24/7 Health Hotline</h3>
            <p className="text-sm text-gray-600">Call for immediate health concerns and emergency guidance.</p>
          </div>

          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Health Information</h3>
            <p className="text-sm text-gray-600">Access health guides, prevention tips, and wellness resources.</p>
          </div>
        </div>
      </div>

      {/* Prevention Tips */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Prevention Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Hygiene</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Wash hands frequently for 20+ seconds
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Use hand sanitizer when soap isn't available
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Avoid touching face, eyes, and mouth
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Clean and disinfect frequently touched surfaces
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Healthy Habits</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Get adequate sleep (7-9 hours)
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Eat nutritious, balanced meals
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Stay hydrated throughout the day
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Exercise regularly and manage stress
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;