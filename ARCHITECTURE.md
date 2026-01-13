# Project Architecture Documentation

## Overview
This is a professional, feature-based architecture for the School Bus Tracking Application. The structure follows industry best practices for React applications with clear separation of concerns, scalability, and maintainability.

## Technology Stack
- **Frontend Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.2
- **Backend**: Firebase (Authentication, Firestore, Functions)
- **Routing**: React Router DOM 6.27.0
- **Maps**: React Leaflet 5.0.0
- **Payments**: Stripe + Google Pay
- **Styling**: CSS with CSS Variables for theming

## Project Structure

```
SchoolBus/
├── functions/                    # Firebase Cloud Functions
│   ├── index.js
│   └── package.json
├── public/                       # Static assets
│   └── robots.txt
├── src/                          # Source code
│   ├── assets/                   # Images, fonts, static files
│   ├── config/                   # Configuration files
│   │   └── firebase.config.js    # Firebase configuration
│   ├── constants/                # Application constants
│   │   ├── index.js              # Barrel export
│   │   ├── payment.constants.js  # Payment configurations
│   │   ├── routes.constants.js   # Route definitions
│   │   └── status.constants.js   # Status configurations
│   ├── contexts/                 # React contexts
│   │   └── ThemeContext.jsx      # Theme provider
│   ├── features/                 # Feature-based modules
│   │   ├── authentication/       # Authentication feature
│   │   │   ├── components/
│   │   │   │   └── Login.jsx
│   │   │   └── index.js
│   │   ├── driver/               # Driver feature
│   │   │   ├── components/
│   │   │   ├── DriverDashboard.jsx
│   │   │   ├── DriverProfile.jsx
│   │   │   ├── FindDrivers.jsx
│   │   │   └── index.js
│   │   ├── parent/               # Parent feature
│   │   │   ├── components/
│   │   │   ├── ParentDashboard.jsx
│   │   │   └── index.js
│   │   ├── shared/               # Shared components
│   │   │   ├── components/
│   │   │   │   ├── EmergencyButton.jsx
│   │   │   │   ├── EmergencyButton.css
│   │   │   │   ├── ErrorBoundary.jsx
│   │   │   │   ├── NotificationCenter.jsx
│   │   │   │   ├── NotificationCenter.css
│   │   │   │   ├── RatingSystem.jsx
│   │   │   │   ├── ServiceAgreement.jsx
│   │   │   │   ├── ServiceAgreement.css
│   │   │   │   ├── ThemeToggle.jsx
│   │   │   │   └── ThemeToggle.css
│   │   │   └── index.js
│   │   ├── subscription/         # Subscription feature
│   │   │   ├── components/
│   │   │   │   ├── SubscriptionDashboard.jsx
│   │   │   │   ├── SubscriptionDashboard.css
│   │   │   │   └── SubscriptionManager.jsx
│   │   │   └── index.js
│   │   └── tracking/             # Tracking feature
│   │       ├── components/
│   │       │   ├── AttendanceTracker.jsx
│   │       │   ├── ETADisplay.jsx
│   │       │   └── TripHistory.jsx
│   │       └── index.js
│   ├── hooks/                    # Custom React hooks
│   │   └── useDriverTracking.js
│   ├── layouts/                  # Layout components
│   ├── lib/                      # Third-party library configurations
│   │   └── firebase.js           # Firebase initialization
│   ├── services/                 # Business logic and API calls
│   │   ├── index.js              # Barrel export
│   │   ├── auth.service.js       # Authentication services
│   │   ├── driver.service.js     # Driver-related services
│   │   ├── notification.service.js # Notification services
│   │   └── student.service.js    # Student-related services
│   ├── utils/                    # Utility functions
│   │   ├── eta.js                # ETA calculations
│   │   └── notifications.js      # Notification helpers
│   ├── App.jsx                   # Root component
│   ├── App.css                   # App styles
│   ├── main.jsx                  # Application entry point
│   ├── index.css                 # Global styles
│   └── styles.css                # Additional styles
├── .env                          # Environment variables (local)
├── .env.production               # Production environment variables
├── .gitignore
├── eslint.config.js
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Firestore security rules
├── index.html
├── package.json
├── vite.config.js
└── README.md

```

## Architecture Principles

### 1. Feature-Based Organization
Instead of grouping files by type (components, pages), we group by feature/domain. Each feature contains:
- Components specific to that feature
- Related business logic
- Feature-specific styles
- An index.js for clean exports

**Benefits**:
- Easy to locate related code
- Features can be developed/tested independently
- Clearer boundaries and responsibilities
- Easier to scale and maintain

### 2. Service Layer Pattern
All Firebase/API interactions are abstracted into service files:
- `auth.service.js` - Authentication operations
- `student.service.js` - Student CRUD operations
- `driver.service.js` - Driver operations
- `notification.service.js` - Notification handling

**Benefits**:
- Single source of truth for data operations
- Easy to mock for testing
- API changes are centralized
- Reusable across components

### 3. Constants Management
All magic strings and configuration values are centralized:
- `status.constants.js` - Student status configurations
- `payment.constants.js` - Payment gateway settings
- `routes.constants.js` - Application routes

**Benefits**:
- No magic strings in components
- Easy to update configurations
- Type-safe (can be converted to TypeScript enums)
- Single source of truth

### 4. Configuration Files
Separate configuration from initialization:
- `config/firebase.config.js` - Firebase configuration
- `lib/firebase.js` - Firebase initialization

**Benefits**:
- Clear separation of concerns
- Easy to switch configurations (dev/prod)
- Configuration can be tested independently

## Feature Modules

### Authentication Feature
**Path**: `src/features/authentication/`
**Responsibility**: Handle user authentication (login, signup, OAuth)
**Components**: Login
**Services Used**: auth.service.js

### Parent Feature
**Path**: `src/features/parent/`
**Responsibility**: Parent dashboard and student monitoring
**Components**: ParentDashboard
**Services Used**: student.service.js, notification.service.js

### Driver Feature
**Path**: `src/features/driver/`
**Responsibility**: Driver dashboard, profile, and discovery
**Components**: DriverDashboard, DriverProfile, FindDrivers
**Services Used**: driver.service.js, student.service.js

### Shared Feature
**Path**: `src/features/shared/`
**Responsibility**: Components used across multiple features
**Components**: EmergencyButton, ErrorBoundary, NotificationCenter, RatingSystem, ServiceAgreement, ThemeToggle
**Services Used**: Various

### Subscription Feature
**Path**: `src/features/subscription/`
**Responsibility**: Payment and subscription management
**Components**: SubscriptionDashboard, SubscriptionManager
**Services Used**: Firebase Functions

### Tracking Feature
**Path**: `src/features/tracking/`
**Responsibility**: Location tracking and trip management
**Components**: AttendanceTracker, ETADisplay, TripHistory
**Services Used**: student.service.js

## Import Patterns

### Feature to Feature Imports
```javascript
// Import from another feature
import { EmergencyButton } from '../shared';
import { TripHistory } from '../tracking';
```

### Service Imports
```javascript
// Import services
import { signInWithEmail, signOut } from '../../services';
import { getStudentsByParent } from '../../services/student.service';
```

### Constants Imports
```javascript
// Import constants
import { STUDENT_STATUS, STATUS_CONFIG } from '../../constants';
import { ROUTES } from '../../constants/routes.constants';
```

### Library Imports
```javascript
// Import Firebase
import { auth, db, functions } from '../../lib/firebase';
```

## Best Practices

### 1. Component Organization
- Keep components focused on presentation
- Move business logic to services
- Use custom hooks for complex state management
- Co-locate styles with components

### 2. State Management
- Use React Context for global state (theme, user)
- Use local state for component-specific data
- Consider adding Redux/Zustand if state becomes complex

### 3. Error Handling
- Use ErrorBoundary for component errors
- Handle async errors in service layer
- Provide user-friendly error messages

### 4. Code Style
- Use functional components with hooks
- Prefer named exports for services/constants
- Use default exports for components
- Follow consistent naming conventions

### 5. File Naming
- Components: PascalCase (e.g., `ParentDashboard.jsx`)
- Services: camelCase with .service suffix (e.g., `auth.service.js`)
- Constants: camelCase with .constants suffix (e.g., `status.constants.js`)
- Utilities: camelCase (e.g., `eta.js`)

## Migration from Old Structure

### Old Structure → New Structure
```
pages/Login.jsx → features/authentication/components/Login.jsx
pages/Parent.jsx → features/parent/ParentDashboard.jsx
pages/Driver.jsx → features/driver/DriverDashboard.jsx
components/EmergencyButton.jsx → features/shared/components/EmergencyButton.jsx
firebase.js → lib/firebase.js + config/firebase.config.js
```

### Import Updates
```javascript
// OLD
import { auth } from './firebase';
import EmergencyButton from './components/EmergencyButton';

// NEW
import { auth } from './lib/firebase';
import { EmergencyButton } from './features/shared';
```

## Environment Variables
Required environment variables (set in `.env` and `.env.production`):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_STRIPE_PUBLISHABLE_KEY=
```

## Future Enhancements

### Recommended Additions
1. **TypeScript**: Add type safety across the application
2. **Testing**: Add Jest + React Testing Library
3. **State Management**: Add Redux Toolkit or Zustand if needed
4. **API Layer**: Create abstraction over Firebase services
5. **Design System**: Create component library with Storybook
6. **Documentation**: Add JSDoc comments to services
7. **CI/CD**: Add GitHub Actions for automated testing/deployment
8. **Monitoring**: Add error tracking (Sentry) and analytics

### Code Quality Tools
- ESLint (already configured)
- Prettier for code formatting
- Husky for pre-commit hooks
- Conventional Commits for commit messages

## Development Workflow

### Starting Development
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build:prod
```

### Deployment
```bash
npm run deploy
```

## Troubleshooting

### Import Errors
If you encounter import errors after restructuring:
1. Clear node_modules and reinstall
2. Restart Vite dev server
3. Check import paths match new structure

### Firebase Configuration
If Firebase isn't working:
1. Verify environment variables are set
2. Check Firebase project configuration
3. Ensure Firestore rules are deployed

## Contributing Guidelines

1. **Feature Development**: Create new features in `src/features/`
2. **Shared Components**: Add to `src/features/shared/`
3. **Services**: Add business logic to `src/services/`
4. **Constants**: Define in `src/constants/`
5. **Barrel Exports**: Update index.js files for clean imports

## Summary

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalable feature-based structure
- ✅ Maintainable codebase
- ✅ Easy to test
- ✅ Industry-standard patterns
- ✅ Ready for team collaboration
- ✅ Prepared for future growth

For questions or improvements, refer to this document or update it as the project evolves.
