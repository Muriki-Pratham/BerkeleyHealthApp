import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Navigation from './components/Navigation';
import WeeklySurvey from './components/WeeklySurvey';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Notifications from './components/Notifications';
import Setup from './components/Setup';

// Services
import { checkSurveyStatus } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [hasSubmittedSurvey, setHasSubmittedSurvey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in localStorage
    const storedUser = localStorage.getItem('healthAppUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      checkUserSurveyStatus(userData.userId);
    } else {
      setLoading(false);
    }
  }, []);

  const checkUserSurveyStatus = async (userId) => {
    try {
      const response = await checkSurveyStatus(userId);
      setHasSubmittedSurvey(response.hasSubmitted);
    } catch (error) {
      console.error('Error checking survey status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSetup = (userData) => {
    setUser(userData);
    localStorage.setItem('healthAppUser', JSON.stringify(userData));
    setHasSubmittedSurvey(false);
  };

  const handleSurveySubmitted = () => {
    setHasSubmittedSurvey(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Berkeley Health App...</p>
        </div>
      </div>
    );
  }

  // If no user, show setup
  if (!user) {
    return <Setup onUserSetup={handleUserSetup} />;
  }

  // If user hasn't submitted weekly survey, require it first
  if (!hasSubmittedSurvey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Health Check</h1>
            <p className="text-gray-600">Please complete your weekly survey to access the app</p>
          </div>
          <WeeklySurvey 
            user={user} 
            onSurveySubmitted={handleSurveySubmitted}
          />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/survey" element={
              <WeeklySurvey 
                user={user} 
                onSurveySubmitted={handleSurveySubmitted}
                allowResubmit={true}
              />
            } />
            <Route path="/analytics" element={<Analytics user={user} />} />
            <Route path="/notifications" element={<Notifications user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-gray-600">
              <p>Berkeley Health App - Keeping our community healthy</p>
              <p className="text-sm mt-2">Anonymous health monitoring for student wellness</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;