import React, { useState } from 'react';
import { createUser } from '../services/api';

const BERKELEY_DORMS = [
  'Unit 1 - Slottman Hall',
  'Unit 1 - Deutsch Hall',
  'Unit 1 - Freeborn Hall',
  'Unit 1 - Putnam Hall',
  'Unit 2 - Ehrman Hall',
  'Unit 2 - Griffiths Hall',
  'Unit 2 - Cunningham Hall',
  'Unit 3 - Spens-Black Hall',
  'Unit 3 - Ida Sproul Hall',
  'Unit 3 - Norton Hall',
  'Clark Kerr Campus',
  'Foothill Residence Halls',
  'Stern Hall',
  'Bowles Hall',
  'Martinez Commons',
  'Other/Off-Campus'
];

function Setup({ onUserSetup }) {
  const [selectedDorm, setSelectedDorm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDorm) {
      setError('Please select your housing location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = await createUser(selectedDorm);
      onUserSetup({
        userId: userData.userId,
        anonymousId: userData.anonymousId,
        dormName: selectedDorm
      });
    } catch (error) {
      console.error('Setup error:', error);
      setError('Failed to set up your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Berkeley Health App</h1>
          <p className="text-gray-600">Anonymous health monitoring for student wellness</p>
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Your responses are completely anonymous. We only need your housing location to provide relevant health insights for your community.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="dorm" className="block text-sm font-medium text-gray-700 mb-2">
                Select your housing location:
              </label>
              <select
                id="dorm"
                value={selectedDorm}
                onChange={(e) => setSelectedDorm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Choose your dorm/housing...</option>
                {BERKELEY_DORMS.map((dorm) => (
                  <option key={dorm} value={dorm}>
                    {dorm}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up...
                </div>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Privacy & Anonymity</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• No personal information is collected</li>
              <li>• Your responses are completely anonymous</li>
              <li>• Data is used only for community health insights</li>
              <li>• You can stop participating at any time</li>
            </ul>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-1 mr-3">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Real-time health trends for your dorm</span>
            </div>
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-1 mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Health alerts and prevention tips</span>
            </div>
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-1 mr-3">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Quick weekly health check (30 seconds)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup;