# Berkeley Health App

A comprehensive health monitoring application for tracking student wellness and disease trends across campus housing. This app enables anonymous health reporting and provides real-time analytics to help communities stay informed about health risks.

## 🎯 Features

### Core Functionality
- **Weekly Health Surveys** - Quick 30-second anonymous health check-ins
- **Real-time Analytics** - Disease trend tracking and visualization
- **Health Alerts** - Automated notifications based on community health data
- **Dorm-specific Insights** - Targeted health information for your housing community
- **AI-powered Analysis** - Intelligent trend detection and risk assessment

### Key Benefits
- **Anonymous & Private** - No personal data collection
- **Efficient** - Minimal time investment (30 seconds weekly)
- **Actionable** - Provides specific health recommendations
- **Community-focused** - Helps protect your dorm community
- **Data-driven** - AI analysis of health patterns

## 🏗️ Architecture

### Frontend (React)
- Modern React 18 with functional components and hooks
- Tailwind CSS for responsive, mobile-first design
- React Router for navigation
- Axios for API communication
- Chart.js for data visualizations

### Backend (Node.js)
- Express.js REST API
- SQLite database for data persistence
- Cron jobs for automated analysis
- Rate limiting and security middleware
- AI-powered health trend analysis

### AI Analysis Engine
- Symptom categorization and clustering
- Risk score calculation
- Trend prediction using linear regression
- Automated alert generation
- Statistical analysis with simple-statistics

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd berkeley-health-app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Production Deployment

1. **Build the frontend**
   ```bash
   cd client && npm run build
   ```

2. **Start the production server**
   ```bash
   cd server && npm start
   ```

## 📊 How It Works

### 1. User Onboarding
- Select your dorm/housing location
- Anonymous ID generation
- Privacy-first approach

### 2. Weekly Health Survey
- **Health Status**: Rate overall wellness (1-5 scale)
- **Symptoms**: Optional symptom reporting from curated list
- **Efficiency**: Designed for <30 second completion

### 3. AI Analysis
- **Data Processing**: Weekly analysis of all survey responses
- **Risk Calculation**: Multi-factor risk scoring algorithm
- **Trend Detection**: Statistical analysis of health patterns
- **Alert Generation**: Automated notifications for high-risk situations

### 4. Community Insights
- **Dashboard**: Real-time health overview for your dorm
- **Analytics**: Detailed trend analysis and symptom tracking
- **Notifications**: Targeted health alerts and recommendations

## 🔒 Privacy & Security

### Data Protection
- **No Personal Information**: Only housing location collected
- **Anonymous IDs**: Randomly generated, non-traceable identifiers
- **Aggregate Analysis**: Individual responses never exposed
- **Local Storage**: User preferences stored locally only

### Security Measures
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- SQL injection prevention

## 📱 User Interface

### Mobile-First Design
- Responsive layout for all screen sizes
- Touch-friendly interface elements
- Fast loading and efficient data usage
- Progressive Web App capabilities

### Accessibility
- WCAG 2.1 compliant design
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes

## 🤖 AI & Analytics

### Health Trend Analysis
```javascript
// Risk Score Calculation
riskScore = (sickPercentage * 40) + 
           (severityFactor * 30) + 
           (symptomDiversity * 20) + 
           (categoryConcentration * 10)
```

### Symptom Categorization
- **Respiratory**: Cough, sore throat, congestion, etc.
- **Gastrointestinal**: Nausea, vomiting, diarrhea, etc.
- **Systemic**: Fever, fatigue, body aches, etc.
- **Other**: Rash, dizziness, anxiety, etc.

### Automated Alerts
- **High Risk** (70+ score): Stay indoors, wear masks, limit gatherings
- **Medium Risk** (40-69 score): Practice good hygiene, monitor symptoms
- **Low Risk** (<40 score): Continue preventive measures

## 🛠️ API Reference

### Survey Endpoints
```
POST /api/surveys/user          # Create anonymous user
GET  /api/surveys/check/:userId # Check survey status
POST /api/surveys/submit        # Submit weekly survey
GET  /api/surveys/stats         # Get survey statistics
```

### Analytics Endpoints
```
GET /api/analytics/current-week  # Current week data
GET /api/analytics/trends        # Historical trends
GET /api/analytics/symptoms      # Symptom analysis
GET /api/analytics/dorm/:name    # Dorm-specific data
GET /api/analytics/risk-levels   # Risk assessments
```

### Notification Endpoints
```
GET  /api/notifications/:dorm    # Get dorm notifications
POST /api/notifications          # Create notification
PUT  /api/notifications/:id/deactivate # Dismiss alert
POST /api/notifications/generate-alerts # Auto-generate alerts
```

## 🎨 Customization

### Dorm Configuration
Update `BERKELEY_DORMS` array in `client/src/components/Setup.js`:
```javascript
const BERKELEY_DORMS = [
  'Your Dorm Name',
  'Another Dorm',
  // ... add more dorms
];
```

### Symptom Categories
Modify symptom lists in `COMMON_SYMPTOMS` array in `client/src/components/WeeklySurvey.js`

### AI Parameters
Adjust analysis parameters in `server/services/aiAnalysis.js`:
- Risk score weights
- Alert thresholds
- Symptom categories

## 🔧 Development

### Project Structure
```
berkeley-health-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── App.js         # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── index.js          # Server entry point
└── package.json          # Root package.json
```

### Available Scripts
```bash
npm run dev          # Start both frontend and backend
npm run client       # Start frontend only
npm run server       # Start backend only
npm run build        # Build for production
npm run install-all  # Install all dependencies
```

### Database Schema
- **users**: Anonymous user tracking
- **surveys**: Weekly health survey responses
- **health_trends**: AI analysis results
- **notifications**: Health alerts and notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🙏 Acknowledgments

- Berkeley student community for feedback and testing
- Open source libraries and frameworks used
- Health professionals who provided guidance on health monitoring best practices

---

**Built with ❤️ for the Berkeley community**
