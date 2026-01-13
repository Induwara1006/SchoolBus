# Migration Guide: Old Structure → New Architecture

This guide helps you understand the changes made to improve the project architecture.

## What Changed?

### File Reorganization
The project has been restructured from a flat component structure to a feature-based architecture. Here's the mapping:

#### Pages → Features
| Old Location | New Location |
|-------------|--------------|
| `src/pages/Login.jsx` | `src/features/authentication/components/Login.jsx` |
| `src/pages/Parent.jsx` | `src/features/parent/ParentDashboard.jsx` |
| `src/pages/Driver.jsx` | `src/features/driver/DriverDashboard.jsx` |
| `src/pages/DriverProfile.jsx` | `src/features/driver/DriverProfile.jsx` |
| `src/pages/FindDrivers.jsx` | `src/features/driver/FindDrivers.jsx` |

#### Components → Features (by domain)
| Old Location | New Location | Feature |
|-------------|--------------|---------|
| `src/components/EmergencyButton.jsx` | `src/features/shared/components/EmergencyButton.jsx` | Shared |
| `src/components/ErrorBoundary.jsx` | `src/features/shared/components/ErrorBoundary.jsx` | Shared |
| `src/components/NotificationCenter.jsx` | `src/features/shared/components/NotificationCenter.jsx` | Shared |
| `src/components/RatingSystem.jsx` | `src/features/shared/components/RatingSystem.jsx` | Shared |
| `src/components/ServiceAgreement.jsx` | `src/features/shared/components/ServiceAgreement.jsx` | Shared |
| `src/components/ThemeToggle.jsx` | `src/features/shared/components/ThemeToggle.jsx` | Shared |
| `src/components/SubscriptionDashboard.jsx` | `src/features/subscription/components/SubscriptionDashboard.jsx` | Subscription |
| `src/components/SubscriptionManager.jsx` | `src/features/subscription/components/SubscriptionManager.jsx` | Subscription |
| `src/components/AttendanceTracker.jsx` | `src/features/tracking/components/AttendanceTracker.jsx` | Tracking |
| `src/components/ETADisplay.jsx` | `src/features/tracking/components/ETADisplay.jsx` | Tracking |
| `src/components/TripHistory.jsx` | `src/features/tracking/components/TripHistory.jsx` | Tracking |

### New Directories

#### Config
- `src/config/firebase.config.js` - Firebase configuration extracted from firebase.js

#### Constants
- `src/constants/status.constants.js` - Student status configurations
- `src/constants/payment.constants.js` - Payment gateway settings
- `src/constants/routes.constants.js` - Application routes
- `src/constants/index.js` - Barrel export

#### Services
- `src/services/auth.service.js` - Authentication operations
- `src/services/student.service.js` - Student CRUD operations
- `src/services/driver.service.js` - Driver operations
- `src/services/notification.service.js` - Notification handling
- `src/services/index.js` - Barrel export

#### Lib
- `src/lib/firebase.js` - Firebase initialization (was `src/firebase.js`)

## Import Changes

### Before (Old Imports)
```javascript
import { auth } from './firebase';
import Login from './pages/Login';
import Parent from './pages/Parent';
import Driver from './pages/Driver';
import EmergencyButton from './components/EmergencyButton';
import ThemeToggle from './components/ThemeToggle';
```

### After (New Imports)
```javascript
import { auth } from './lib/firebase';
import { Login } from './features/authentication';
import { ParentDashboard } from './features/parent';
import { DriverDashboard } from './features/driver';
import { EmergencyButton, ThemeToggle } from './features/shared';
```

## Key Improvements

### 1. Feature-Based Organization
**Before**: All components in one folder
```
src/
  components/
    EmergencyButton.jsx
    ThemeToggle.jsx
    SubscriptionDashboard.jsx
    AttendanceTracker.jsx
    ...
```

**After**: Components grouped by feature
```
src/
  features/
    shared/
      components/
        EmergencyButton.jsx
        ThemeToggle.jsx
    subscription/
      components/
        SubscriptionDashboard.jsx
    tracking/
      components/
        AttendanceTracker.jsx
```

### 2. Service Layer
**Before**: Firebase calls scattered in components
```javascript
// In component
const handleLogin = async () => {
  await signInWithEmailAndPassword(auth, email, password);
};
```

**After**: Centralized service layer
```javascript
// In component
import { signInWithEmail } from '../../services';

const handleLogin = async () => {
  const result = await signInWithEmail(email, password);
  if (result.success) {
    // Handle success
  }
};
```

### 3. Constants Management
**Before**: Magic strings in components
```javascript
const statusConfig = {
  'at-home': { label: 'At Home', color: '#6b7280', icon: '🏠' },
  'waiting-pickup': { label: 'Waiting for Pickup', color: '#f59e0b', icon: '⏰' },
  // ...
};
```

**After**: Centralized constants
```javascript
import { STUDENT_STATUS, STATUS_CONFIG } from '../../constants';

const status = STUDENT_STATUS.AT_HOME;
const config = STATUS_CONFIG[status];
```

## Breaking Changes

### Import Paths
All import paths have changed. The codebase has been updated, but if you have custom code:

**Update these imports**:
- `'./firebase'` → `'./lib/firebase'` or `'../lib/firebase'`
- `'./pages/...'` → `'./features/.../...`
- `'./components/...'` → `'./features/.../components/...'`

### Component Names
Some components have been renamed for clarity:
- `Parent.jsx` → `ParentDashboard.jsx`
- `Driver.jsx` → `DriverDashboard.jsx`

## Migration Checklist

If you have uncommitted changes or custom code:

- [ ] Update Firebase imports: `./firebase` → `./lib/firebase`
- [ ] Update page imports to use features
- [ ] Update component imports to use features
- [ ] Use service layer for Firebase calls
- [ ] Import constants instead of hardcoding values
- [ ] Test all functionality after migration
- [ ] Update any custom scripts or tools

## Testing After Migration

### 1. Authentication Flow
- [ ] Login with email/password works
- [ ] Login with Google works
- [ ] Sign up works
- [ ] Logout works

### 2. Parent Dashboard
- [ ] Can view students
- [ ] Can see student locations
- [ ] Can track bus
- [ ] Notifications work
- [ ] Payment integration works

### 3. Driver Dashboard
- [ ] Can view assigned students
- [ ] Can update student status
- [ ] Location tracking works
- [ ] Can manage ride requests

### 4. Shared Features
- [ ] Theme toggle works
- [ ] Notifications display correctly
- [ ] Emergency button functions
- [ ] Error boundary catches errors

## Common Issues

### Issue: Import errors after restructuring
**Solution**: Clear node_modules and reinstall
```bash
rm -rf node_modules
npm install
```

### Issue: "Cannot find module" errors
**Solution**: Check import paths match new structure
- Features use relative imports: `'../../lib/firebase'`
- Barrel exports: `'../shared'` instead of `'../shared/components/Component'`

### Issue: Firebase not initializing
**Solution**: Check environment variables are set correctly
```bash
# Check .env file exists
cat .env

# Restart dev server
npm run dev
```

## Benefits of New Architecture

### For Developers
✅ **Easier Navigation**: Find related code quickly by feature
✅ **Better Organization**: Clear separation of concerns
✅ **Reusable Code**: Service layer can be used across components
✅ **Maintainability**: Changes are localized to features
✅ **Scalability**: Easy to add new features

### For the Project
✅ **Professional Structure**: Industry-standard architecture
✅ **Team-Ready**: Multiple developers can work simultaneously
✅ **Testing**: Easier to write unit and integration tests
✅ **Documentation**: Clear architecture documentation
✅ **Future-Proof**: Ready for TypeScript, testing, etc.

## Next Steps

1. **Review Architecture**: Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Test Application**: Run through all features
3. **Update Documentation**: Update any custom docs
4. **Consider Enhancements**: TypeScript, testing, etc.

## Questions?

Refer to:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete architecture guide
- [README.md](./README.md) - Project overview
- Feature-specific documentation in each feature folder

## Old Files

The old structure files are still present for reference:
- `src/pages/` - Original page components
- `src/components/` - Original flat component structure
- `src/firebase.js` - Original Firebase initialization

You can safely delete these after confirming everything works:
```bash
# After testing, remove old files
rm -rf src/pages
rm -rf src/components
rm src/firebase.js
```

⚠️ **Important**: Test thoroughly before deleting old files!

---

**Migration Date**: January 2026
**Architecture Version**: 2.0
