import React, { useState } from 'react';
import { submitSurvey } from '../services/api';

const COMMON_SYMPTOMS = [
  'Fever',
  'Cough',
  'Sore Throat',
  'Runny Nose',
  'Congestion',
  'Headache',
  'Body Aches',
  'Fatigue',
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Loss of Appetite',
  'Shortness of Breath',
  'Chills',
  'Rash',
  'Dizziness'
];

const SEVERITY_LEVELS = [
  { value: 1, label: 'Feeling Great', description: 'No symptoms, excellent health', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  { value: 2, label: 'Minor Issues', description: 'Very mild symptoms, not affecting daily activities', color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
  { value: 3, label: 'Moderate', description: 'Noticeable symptoms, some impact on activities', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 4, label: 'Significant', description: 'Strong symptoms, affecting daily routine', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { value: 5, label: 'Severe', description: 'Very strong symptoms, major impact on activities', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
];

function WeeklySurvey({ user, onSurveySubmitted, allowResubmit = false }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severityLevel, setSeverityLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
    
    // If they select symptoms, automatically set severity to at least 2
    if (!selectedSymptoms.includes(symptom) && severityLevel === 1) {
      setSeverityLevel(2);
    }
    
    // If they remove all symptoms, set back to 1
    if (selectedSymptoms.length === 1 && selectedSymptoms.includes(symptom)) {
      setSeverityLevel(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (selectedSymptoms.length > 0 && severityLevel === 1) {
      setError('Please select an appropriate severity level for your symptoms');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await submitSurvey(user.userId, selectedSymptoms, severityLevel);
      setSubmitted(true);
      
      // Delay before calling onSurveySubmitted to show success message
      setTimeout(() => {
        onSurveySubmitted();
      }, 2000);
    } catch (error) {
      console.error('Survey submission error:', error);
      if (error.response?.data?.error === 'Survey already submitted for this week') {
        setError('You have already submitted your survey for this week. Thank you!');
      } else {
        setError('Failed to submit survey. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Survey Submitted!</h2>
          <p className="text-gray-600 mb-4">Thank you for contributing to our community health data.</p>
          <p className="text-sm text-gray-500">You can now access the health analytics dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Weekly Health Check</h2>
          <p className="text-gray-600">This should take less than 30 seconds</p>
          <p className="text-sm text-gray-500 mt-1">Housing: {user.dormName}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Severity Level Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How are you feeling this week?</h3>
            <div className="space-y-3">
              {SEVERITY_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    severityLevel === level.value
                      ? `${level.bg} border-current ${level.color}`
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={level.value}
                    checked={severityLevel === level.value}
                    onChange={(e) => setSeverityLevel(parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${severityLevel === level.value ? level.color : 'text-gray-900'}`}>
                        {level.label}
                      </div>
                      <div className={`text-sm ${severityLevel === level.value ? level.color : 'text-gray-600'}`}>
                        {level.description}
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      severityLevel === level.value
                        ? `border-current ${level.color} bg-current`
                        : 'border-gray-300'
                    }`}>
                      {severityLevel === level.value && (
                        <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Symptom Selection - Only show if severity > 1 */}
          {severityLevel > 1 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Which symptoms are you experiencing? (Optional)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <label
                    key={symptom}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSymptoms.includes(symptom)
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={() => handleSymptomToggle(symptom)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                      selectedSymptoms.includes(symptom)
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedSymptoms.includes(symptom) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">{symptom}</span>
                  </label>
                ))}
              </div>
              
              {selectedSymptoms.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected symptoms:</strong> {selectedSymptoms.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Health Check'
              )}
            </button>
          </div>

          {/* Survey Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Your responses are anonymous and help improve community health awareness
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WeeklySurvey;