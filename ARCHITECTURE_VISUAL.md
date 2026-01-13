# 📊 Architecture Visual Guide

## Project Structure Visualization

```
SchoolBus/
│
├── 📦 Root Configuration Files
│   ├── package.json              # Dependencies & scripts
│   ├── vite.config.js            # Build config + path aliases
│   ├── jsconfig.json             # IDE support
│   ├── eslint.config.js          # Linting rules
│   ├── firebase.json             # Firebase config
│   ├── firestore.rules           # Security rules
│   └── index.html                # Entry HTML
│
├── 🔥 Firebase Functions
│   └── functions/
│       ├── index.js              # Cloud functions
│       └── package.json          # Functions dependencies
│
├── 📄 Documentation
│   ├── ARCHITECTURE.md           # Complete architecture guide
│   ├── MIGRATION_GUIDE.md        # Migration instructions
│   ├── QUICK_REFERENCE.md        # Quick lookup
│   ├── RESTRUCTURE_COMPLETE.md   # This restructure summary
│   └── README_NEW.md             # Updated README
│
└── 💻 Source Code (src/)
    │
    ├── 🎯 Features (Feature Modules)
    │   ├── authentication/
    │   │   ├── components/
    │   │   │   └── Login.jsx
    │   │   └── index.js          # Exports
    │   │
    │   ├── parent/
    │   │   ├── components/
    │   │   ├── ParentDashboard.jsx
    │   │   └── index.js
    │   │
    │   ├── driver/
    │   │   ├── components/
    │   │   ├── DriverDashboard.jsx
    │   │   ├── DriverProfile.jsx
    │   │   ├── FindDrivers.jsx
    │   │   └── index.js
    │   │
    │   ├── shared/
    │   │   ├── components/
    │   │   │   ├── EmergencyButton.jsx
    │   │   │   ├── ErrorBoundary.jsx
    │   │   │   ├── NotificationCenter.jsx
    │   │   │   ├── RatingSystem.jsx
    │   │   │   ├── ServiceAgreement.jsx
    │   │   │   └── ThemeToggle.jsx
    │   │   └── index.js
    │   │
    │   ├── subscription/
    │   │   ├── components/
    │   │   │   ├── SubscriptionDashboard.jsx
    │   │   │   └── SubscriptionManager.jsx
    │   │   └── index.js
    │   │
    │   ├── tracking/
    │   │   ├── components/
    │   │   │   ├── AttendanceTracker.jsx
    │   │   │   ├── ETADisplay.jsx
    │   │   │   └── TripHistory.jsx
    │   │   └── index.js
    │   │
    │   └── index.js              # Barrel export all features
    │
    ├── 🔧 Services (Business Logic)
    │   ├── auth.service.js       # Authentication logic
    │   ├── student.service.js    # Student CRUD
    │   ├── driver.service.js     # Driver operations
    │   ├── notification.service.js # Notifications
    │   └── index.js              # Barrel export
    │
    ├── 📋 Constants (Configuration)
    │   ├── status.constants.js   # Status configs
    │   ├── payment.constants.js  # Payment settings
    │   ├── routes.constants.js   # Route definitions
    │   └── index.js              # Barrel export
    │
    ├── ⚙️ Config (App Configuration)
    │   └── firebase.config.js    # Firebase config
    │
    ├── 🔌 Lib (Third-party Setup)
    │   └── firebase.js           # Firebase initialization
    │
    ├── 🎣 Hooks (Custom React Hooks)
    │   └── useDriverTracking.js
    │
    ├── 🌐 Contexts (React Contexts)
    │   └── ThemeContext.jsx
    │
    ├── 🛠️ Utils (Utility Functions)
    │   ├── eta.js
    │   └── notifications.js
    │
    ├── 🎨 Assets (Static Files)
    │   └── (images, fonts, etc.)
    │
    ├── 📱 Application Entry
    │   ├── main.jsx              # App entry point
    │   ├── App.jsx               # Root component
    │   ├── App.css               # App styles
    │   ├── index.css             # Global styles
    │   └── styles.css            # Additional styles
    │
    └── 📐 Layouts (Layout Components)
        └── (future layout components)
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│                      (React Components)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Feature Modules                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Parent  │  │  Driver  │  │  Shared  │  │ Tracking │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Student  │  │  Driver  │  │  Notify  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Backend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │Firestore │  │Functions │  │ Storage  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Dependency Flow

```
App.jsx
  │
  ├─→ ThemeProvider (Context)
  │     │
  │     ├─→ ThemeToggle (Shared Component)
  │     └─→ All Components (themed)
  │
  ├─→ Router
  │     │
  │     ├─→ Login (Authentication Feature)
  │     │     └─→ auth.service.js
  │     │
  │     ├─→ ParentDashboard (Parent Feature)
  │     │     ├─→ student.service.js
  │     │     ├─→ EmergencyButton (Shared)
  │     │     ├─→ TripHistory (Tracking)
  │     │     └─→ AttendanceTracker (Tracking)
  │     │
  │     ├─→ DriverDashboard (Driver Feature)
  │     │     ├─→ student.service.js
  │     │     ├─→ driver.service.js
  │     │     └─→ notification.service.js
  │     │
  │     └─→ SubscriptionDashboard (Subscription Feature)
  │           └─→ Firebase Functions
  │
  └─→ NotificationCenter (Shared Component)
        └─→ notification.service.js
```

## Feature Module Structure

```
Feature Module
│
├── 📁 components/              # Feature-specific components
│   ├── Component1.jsx
│   ├── Component1.css
│   ├── Component2.jsx
│   └── Component2.css
│
├── 📄 FeaturePage.jsx          # Main feature page
│
└── 📄 index.js                 # Barrel export
    │
    └── Exports:
        ├── FeaturePage
        ├── Component1
        └── Component2
```

## Service Layer Pattern

```
Component
    │
    │ import { serviceName } from '@services'
    │
    ▼
Service Layer
    │
    │ - Validates input
    │ - Handles errors
    │ - Transforms data
    │
    ▼
Firebase SDK
    │
    ▼
Firebase Backend
```

## Import Path Examples

```
┌────────────────────────────────────────────────────────────┐
│ From: src/features/parent/ParentDashboard.jsx             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Firebase:                                                  │
│   import { auth } from '@lib/firebase'                    │
│   import { auth } from '../../lib/firebase'               │
│                                                            │
│ Services:                                                  │
│   import { getStudents } from '@services'                 │
│   import { getStudents } from '../../services'            │
│                                                            │
│ Constants:                                                 │
│   import { STUDENT_STATUS } from '@constants'             │
│   import { STUDENT_STATUS } from '../../constants'        │
│                                                            │
│ Shared Components:                                         │
│   import { EmergencyButton } from '@features/shared'      │
│   import { EmergencyButton } from '../shared'             │
│                                                            │
│ Other Features:                                            │
│   import { TripHistory } from '@features/tracking'        │
│   import { TripHistory } from '../tracking'               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Barrel Export Pattern

```
features/
  authentication/
    components/
      Login.jsx ────────┐
    index.js            │
      │                 │
      └─ export { default as Login } from './components/Login'
                        │
                        ▼
App.jsx:
  import { Login } from './features/authentication'
```

## Authentication Flow

```
User Action
    │
    ▼
Login Component
    │
    │ import { signInWithEmail } from '@services'
    │
    ▼
auth.service.js
    │
    │ - Validates credentials
    │ - Calls Firebase Auth
    │ - Returns result
    │
    ▼
Firebase Auth
    │
    ▼
User Authenticated
    │
    ├─→ Save to Context
    ├─→ Update Local Storage
    └─→ Navigate to Dashboard
```

## Real-time Data Flow

```
Firebase Firestore
    │ (Real-time updates)
    ▼
Service Layer
    │ subscribeToStudents()
    │ onSnapshot()
    ▼
Component State
    │ setState()
    ▼
React Re-render
    │
    ▼
Updated UI
```

## State Management

```
┌──────────────────────────────────────┐
│         Global State                  │
│  (React Context)                      │
│  ┌────────────┐  ┌────────────┐     │
│  │   Theme    │  │    User    │     │
│  └────────────┘  └────────────┘     │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│         Local State                   │
│  (useState, useEffect)                │
│  ┌────────────┐  ┌────────────┐     │
│  │  Students  │  │   Driver   │     │
│  └────────────┘  └────────────┘     │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│      Component Render                 │
└──────────────────────────────────────┘
```

## Build Process

```
Source Code (src/)
    │
    │ npm run build
    │
    ▼
Vite Bundler
    │
    ├─→ Code Splitting
    ├─→ Minification
    ├─→ Tree Shaking
    └─→ Optimization
    │
    ▼
Output (dist/)
    │
    ├─→ index.html
    ├─→ assets/
    │   ├─→ react-vendor.[hash].js
    │   ├─→ firebase-vendor.[hash].js
    │   ├─→ map-vendor.[hash].js
    │   └─→ app.[hash].js
    │
    └─→ Deploy to Firebase Hosting
```

## Feature Development Workflow

```
1. Create Feature Folder
   features/new-feature/

2. Add Components
   features/new-feature/components/

3. Create Main Page
   features/new-feature/NewFeature.jsx

4. Add Service (if needed)
   services/new-feature.service.js

5. Add Constants (if needed)
   constants/new-feature.constants.js

6. Export from index.js
   features/new-feature/index.js

7. Add Route in App.jsx
   <Route path="/new" element={<NewFeature />} />

8. Test & Deploy
```

## Scalability Pattern

```
Current Structure:
features/
  authentication/  (1 component)
  parent/         (1 component)
  driver/         (3 components)
  shared/         (6 components)
  subscription/   (2 components)
  tracking/       (3 components)

Future Growth:
features/
  authentication/  → Add SSO, 2FA components
  parent/         → Add analytics, reports
  driver/         → Add route planning
  shared/         → Add more reusable components
  subscription/   → Add billing, invoices
  tracking/       → Add advanced analytics
  analytics/      → NEW feature module
  reporting/      → NEW feature module
  admin/          → NEW feature module
```

---

## Legend

- 📦 Root files
- 🔥 Firebase
- 📄 Documentation
- 💻 Source code
- 🎯 Features
- 🔧 Services
- 📋 Constants
- ⚙️ Configuration
- 🔌 Libraries
- 🎣 Hooks
- 🌐 Contexts
- 🛠️ Utils
- 🎨 Assets
- 📱 Entry points
- 📐 Layouts

---

**This visual guide helps you understand the complete architecture at a glance!**
