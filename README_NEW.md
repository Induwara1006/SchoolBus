# 🚌 School Bus Tracking System - Professional Architecture

A modern, production-ready school bus tracking application built with React, Firebase, and industry-standard architecture patterns.

## 🏗️ Architecture Highlights

This project follows **professional best practices** with:

- ✅ **Feature-Based Architecture** - Components organized by domain/feature
- ✅ **Service Layer Pattern** - Centralized business logic and API calls
- ✅ **Constants Management** - No magic strings, centralized configurations
- ✅ **Clean Code Principles** - Separation of concerns, DRY, SOLID
- ✅ **Scalable Structure** - Easy to extend and maintain
- ✅ **Path Aliases** - Clean imports with @ prefixes
- ✅ **Production Ready** - Optimized builds and performance

## 📁 Project Structure

```
SchoolBus/
├── src/
│   ├── features/           # Feature-based modules
│   │   ├── authentication/ # Login & auth
│   │   ├── parent/         # Parent dashboard
│   │   ├── driver/         # Driver features
│   │   ├── shared/         # Shared components
│   │   ├── subscription/   # Payment & subscriptions
│   │   └── tracking/       # Location & trip tracking
│   ├── services/           # Business logic & API
│   │   ├── auth.service.js
│   │   ├── student.service.js
│   │   ├── driver.service.js
│   │   └── notification.service.js
│   ├── constants/          # App constants & configs
│   ├── lib/                # Third-party configs
│   ├── config/             # App configuration
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   └── utils/              # Utility functions
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd SchoolBus
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Create .env file
cp .env.example .env

# Add your Firebase and Stripe credentials
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

4. **Start development server**
```bash
npm run dev
```

5. **Open browser**
```
http://localhost:5173
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete architecture guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration from old structure
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[FEATURES_STATUS.md](./FEATURES_STATUS.md)** - Feature implementation status

## 🎯 Features

### For Parents
- 👀 **Real-time Tracking** - Track bus location on map
- 📱 **Status Updates** - Get notified of pickup/dropoff
- 🚨 **Emergency Alerts** - Quick emergency contact
- 💳 **Subscription Management** - Manage payments
- 📊 **Trip History** - View past trips
- ✅ **Attendance Tracking** - Monitor student attendance

### For Drivers
- 🚌 **Student Management** - Manage assigned students
- 📍 **Location Sharing** - Share real-time location
- 📝 **Status Updates** - Update student status
- 🔔 **Notifications** - Receive ride requests
- 💰 **Earnings Dashboard** - Track subscriptions

### Shared Features
- 🌓 **Dark/Light Mode** - Theme toggle
- 🔐 **Secure Authentication** - Email + Google OAuth
- 💬 **Real-time Notifications** - Firebase notifications
- ⭐ **Rating System** - Rate drivers/parents
- 📄 **Service Agreement** - Terms acceptance

## 🛠️ Technology Stack

### Frontend
- **React 19.1.1** - UI framework
- **React Router 6.27** - Routing
- **Vite 7.1.2** - Build tool
- **React Leaflet** - Maps

### Backend
- **Firebase Auth** - Authentication
- **Firestore** - Database
- **Firebase Functions** - Serverless backend
- **Firebase Hosting** - Hosting

### Payment
- **Stripe** - Payment processing
- **Google Pay** - Mobile payments

## 🔧 Development

### Project Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:prod   # Build with production env
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run deploy       # Deploy to Firebase
```

### Code Organization

#### Feature Structure
```
features/
  feature-name/
    components/      # Feature-specific components
    FeaturePage.jsx  # Main feature page
    index.js         # Exports
```

#### Service Layer
```javascript
// services/student.service.js
export const getStudentsByParent = async (parentId) => {
  // Firebase logic here
  return students;
};
```

#### Constants
```javascript
// constants/status.constants.js
export const STUDENT_STATUS = {
  AT_HOME: 'at-home',
  PICKED_UP: 'picked-up',
  // ...
};
```

### Import Examples

```javascript
// Using path aliases
import { auth } from '@lib/firebase';
import { getStudents } from '@services';
import { STUDENT_STATUS } from '@constants';
import { EmergencyButton } from '@features/shared';

// Or relative imports
import { auth } from '../../lib/firebase';
```

## 🎨 Code Style

### Component Pattern
```javascript
import { useState, useEffect } from 'react';
import { getStudents } from '@services';
import { STUDENT_STATUS } from '@constants';

export default function StudentList() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Load students
  }, []);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Service Pattern
```javascript
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@lib/firebase';

export const getStudents = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'students'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

## 🧪 Testing

```bash
# Run tests (to be added)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Building for Production

```bash
# Build optimized production bundle
npm run build:prod

# Preview production build locally
npm run preview

# Deploy to Firebase
npm run deploy
```

### Build Optimizations
- Code splitting by vendor chunks
- Tree shaking for unused code
- Minification with Terser
- Optimized asset loading
- Environment-based configs

## 🚀 Deployment

### Firebase Hosting
```bash
# Login to Firebase
firebase login

# Initialize project (first time)
firebase init

# Deploy
npm run deploy
```

### Environment Variables
Set in Firebase Hosting:
```bash
firebase functions:config:set stripe.key="sk_live_..."
```

## 🤝 Contributing

### Guidelines
1. Follow the feature-based architecture
2. Use the service layer for API calls
3. Define constants instead of magic strings
4. Write meaningful commit messages
5. Test your changes thoroughly

### Adding a New Feature
```bash
# 1. Create feature folder
mkdir -p src/features/new-feature/components

# 2. Create feature files
touch src/features/new-feature/index.js
touch src/features/new-feature/NewFeature.jsx

# 3. Add services if needed
touch src/services/new-feature.service.js

# 4. Add constants if needed
touch src/constants/new-feature.constants.js
```

## 📝 License

This project is private and proprietary.

## 👥 Team

- **Architecture**: Professional React patterns
- **Backend**: Firebase services
- **Frontend**: React + Vite

## 🐛 Troubleshooting

### Common Issues

**Import errors**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

**Firebase errors**
```bash
# Check environment variables
cat .env

# Verify Firebase config
firebase projects:list
```

**Build errors**
```bash
# Clear build cache
rm -rf dist
npm run build
```

## 📞 Support

For issues or questions:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
3. Review feature-specific docs
4. Create an issue

## 🔄 Updates

### Version 2.0 (January 2026)
- ✅ Complete architecture restructure
- ✅ Feature-based organization
- ✅ Service layer implementation
- ✅ Constants management
- ✅ Path aliases
- ✅ Comprehensive documentation

### Roadmap
- [ ] TypeScript migration
- [ ] Unit tests with Jest
- [ ] E2E tests with Playwright
- [ ] Component library with Storybook
- [ ] CI/CD pipeline
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring

## 🌟 Key Benefits

### For Developers
- 🎯 **Easy Navigation** - Find code by feature
- 🔧 **Maintainable** - Clear separation of concerns
- 📦 **Reusable** - Service layer and shared components
- 🚀 **Scalable** - Easy to add features
- 📖 **Well-Documented** - Comprehensive docs

### For the Project
- ✅ **Professional** - Industry-standard patterns
- 👥 **Team-Ready** - Multiple devs can work together
- 🧪 **Testable** - Easy to write tests
- 🔮 **Future-Proof** - Ready for TypeScript, etc.
- 🎨 **Clean Code** - Follows best practices

---

**Built with ❤️ using professional React architecture patterns**
