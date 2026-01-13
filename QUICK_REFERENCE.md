# Quick Reference Guide

## 📍 Where to Find Things

### Adding a New Component

#### Shared Component (used across features)
```
src/features/shared/components/NewComponent.jsx
src/features/shared/components/NewComponent.css
```

#### Feature-Specific Component
```
src/features/[feature-name]/components/NewComponent.jsx
```

### Adding Business Logic

#### New Service
```
src/services/new-feature.service.js
```

#### Add to Barrel Export
```javascript
// src/services/index.js
export * from './new-feature.service';
```

### Adding Constants

#### New Constants File
```
src/constants/new-feature.constants.js
```

#### Add to Barrel Export
```javascript
// src/constants/index.js
export * from './new-feature.constants';
```

### Adding a New Page/Route

1. Create page in feature folder:
```
src/features/[feature]/NewPage.jsx
```

2. Export from feature index:
```javascript
// src/features/[feature]/index.js
export { default as NewPage } from './NewPage';
```

3. Add route in App.jsx:
```javascript
import { NewPage } from './features/[feature]';

<Route path="/new-page" element={<NewPage />} />
```

## 🔧 Common Tasks

### Import Firebase
```javascript
import { auth, db, functions } from '@lib/firebase';
// or
import { auth, db, functions } from '../../lib/firebase';
```

### Import Services
```javascript
import { getStudents, addStudent } from '@services';
// or
import { getStudents } from '@services/student.service';
```

### Import Constants
```javascript
import { STUDENT_STATUS, STATUS_CONFIG } from '@constants';
```

### Import Shared Components
```javascript
import { EmergencyButton, ThemeToggle } from '@features/shared';
```

### Import from Another Feature
```javascript
import { TripHistory } from '@features/tracking';
```

## 📂 Directory Reference

| Directory | Purpose | Example |
|-----------|---------|---------|
| `src/features/` | Feature modules | `features/authentication/` |
| `src/services/` | Business logic | `services/auth.service.js` |
| `src/constants/` | App constants | `constants/status.constants.js` |
| `src/lib/` | 3rd party configs | `lib/firebase.js` |
| `src/config/` | App configs | `config/firebase.config.js` |
| `src/hooks/` | Custom hooks | `hooks/useDriverTracking.js` |
| `src/contexts/` | React contexts | `contexts/ThemeContext.jsx` |
| `src/utils/` | Utilities | `utils/eta.js` |

## 🎯 Import Path Patterns

### From App.jsx (root)
```javascript
import { auth } from './lib/firebase';
import { Login } from './features/authentication';
import { ThemeToggle } from './features/shared';
```

### From Feature Component
```javascript
// Same feature
import { ComponentName } from '../components/ComponentName';

// Different feature
import { ComponentName } from '../../other-feature';

// Services
import { serviceName } from '../../../services';

// Constants
import { CONSTANT } from '../../../constants';

// Firebase
import { auth } from '../../../lib/firebase';
```

### Using Path Aliases (Alternative)
```javascript
import { auth } from '@lib/firebase';
import { getStudents } from '@services';
import { STUDENT_STATUS } from '@constants';
import { EmergencyButton } from '@features/shared';
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Root component, routing |
| `src/main.jsx` | Entry point |
| `src/lib/firebase.js` | Firebase initialization |
| `src/config/firebase.config.js` | Firebase configuration |
| `vite.config.js` | Vite configuration |
| `jsconfig.json` | IDE configuration |
| `package.json` | Dependencies |

## 🎨 Naming Conventions

### Files
- Components: `PascalCase.jsx` (e.g., `StudentList.jsx`)
- Services: `camelCase.service.js` (e.g., `student.service.js`)
- Constants: `camelCase.constants.js` (e.g., `status.constants.js`)
- Utils: `camelCase.js` (e.g., `eta.js`)
- Styles: Match component name (e.g., `StudentList.css`)

### Variables & Functions
- Variables: `camelCase` (e.g., `studentList`)
- Functions: `camelCase` (e.g., `getStudents`)
- Components: `PascalCase` (e.g., `StudentList`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `STUDENT_STATUS`)

### Exports
- Components: Default export
  ```javascript
  export default function StudentList() { }
  ```
- Services: Named export
  ```javascript
  export const getStudents = async () => { }
  ```
- Constants: Named export
  ```javascript
  export const STUDENT_STATUS = { }
  ```

## 🚀 Development Workflow

### 1. Start Development
```bash
npm run dev
```

### 2. Make Changes
- Add components in appropriate feature folder
- Add business logic in services
- Define constants in constants folder
- Update barrel exports (index.js)

### 3. Test Changes
- Check browser (http://localhost:5173)
- Check console for errors
- Test all affected features

### 4. Build & Deploy
```bash
npm run build:prod
npm run deploy
```

## 🐛 Debugging

### Check Imports
```bash
# Search for old import patterns
grep -r "from './firebase'" src/
grep -r "from './pages/" src/
```

### Check Firebase
```javascript
// Add to component
console.log('Auth:', auth.currentUser);
console.log('DB:', db);
```

### Check Services
```javascript
// In component
import { getStudents } from '@services';

const loadData = async () => {
  try {
    const data = await getStudents();
    console.log('Data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 📚 Code Snippets

### Service Function
```javascript
export const getStudentsByParent = async (parentId) => {
  try {
    const q = query(
      collection(db, 'students'),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

### Component with Service
```javascript
import { useState, useEffect } from 'react';
import { getStudents } from '@services';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await getStudents();
        setStudents(data);
      } catch (error) {
        console.error('Failed to load:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStudents();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {students.map(student => (
        <div key={student.id}>{student.name}</div>
      ))}
    </div>
  );
}
```

### Using Constants
```javascript
import { STUDENT_STATUS, STATUS_CONFIG } from '@constants';

const status = STUDENT_STATUS.AT_HOME;
const config = STATUS_CONFIG[status];

console.log(config.label); // "At Home"
console.log(config.color); // "#6b7280"
console.log(config.icon);  // "🏠"
```

## ⚡ Performance Tips

1. **Code Splitting**: Features are auto-split by Vite
2. **Lazy Loading**: Use React.lazy for large components
3. **Memoization**: Use React.memo, useMemo, useCallback
4. **Service Layer**: Prevents duplicate API calls

## 🔒 Security

1. **Environment Variables**: Never commit .env
2. **Firebase Rules**: Review firestore.rules
3. **Auth**: Always check user authentication
4. **Validation**: Validate inputs on client and server

## 📖 Further Reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Full architecture guide
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration details
- [README_NEW.md](./README_NEW.md) - Updated README

---

**Quick Tip**: Use Ctrl+P (VS Code) to quickly find files by name!
