import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import './App.css';
import Login from './pages/Login.jsx';
import Parent from './pages/Parent.jsx';
import Driver from './pages/Driver.jsx';
import FindDrivers from './pages/FindDrivers.jsx';
import DriverProfile from './pages/DriverProfile.jsx';

function LogoutConfirmationModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ maxWidth: 400, margin: 0 }}>
        <h3>Confirm Logout</h3>
        <p style={{ marginBottom: 20, color: '#666' }}>
          Are you sure you want to logout and return to the home page? You'll need to sign in again to access your dashboard.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const savedRole = localStorage.getItem('user.role');
        setUserRole(savedRole || '');
      } else {
        setUserRole('');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleHomeClick = (e) => {
    // If user is logged in and not already on home page, show confirmation
    if (user && location.pathname !== '/') {
      e.preventDefault();
      setShowLogoutModal(true);
    }
  };

  const handleLogoutConfirm = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user.role');
      localStorage.removeItem('driver.busId');
      setShowLogoutModal(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };
  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand">
          <span className="brand-badge" />
          <span>School Transport</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle />
          {location.pathname !== '/' && (
            <nav className="nav">
              <Link to="/" onClick={handleHomeClick}>Home</Link>
              
              {/* Show role-specific navigation */}
              {user && userRole === 'driver' && (
                <>
                  <Link to="/driver">Dashboard</Link>
                  <Link to="/driver-profile">Profile</Link>
                </>
              )}
              
              {user && userRole === 'parent' && (
                <>
                  <Link to="/parent">Dashboard</Link>
                </>
              )}
              
              {/* Show general links only when not logged in */}
              {!user && (
                <>
                </>
              )}

              {user && (
                <span style={{ marginLeft: 'auto', fontSize: '0.9em', color: 'var(--muted)' }}>
                  {user.email} ({userRole})
                </span>
              )}
            </nav>
          )}
        </div>
      </header>

      <div className="content">
      <Routes>
        <Route
          path="/"
          element={
            <div className="card">
              <h3>School Transport System</h3>
              <h4 style={{ marginTop: 20, marginBottom: 16 }}>What would you like to do?</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 450 }}>
                <Link className="btn btn-primary" to="/login?role=driver" style={{ padding: '20px 24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '1.5em', fontWeight: 'bold', minWidth: '30px' }}>🚌</span>
                  <div>
                    <div style={{ fontSize: '1.1em', fontWeight: 600 }}>Driver Dashboard</div>
                    <div style={{ fontSize: '0.9em', opacity: 0.8, marginTop: 4 }}>
                      Track location & manage students
                    </div>
                  </div>
                </Link>
                <Link className="btn btn-primary" to="/login?role=parent" style={{ padding: '20px 24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '1.5em', fontWeight: 'bold', minWidth: '30px' }}>👨‍👩‍👧‍👦</span>
                  <div>
                    <div style={{ fontSize: '1.1em', fontWeight: 600 }}>Parent Dashboard</div>
                    <div style={{ fontSize: '0.9em', opacity: 0.8, marginTop: 4 }}>
                      Monitor your children's status
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/find-drivers" element={<FindDrivers />} />
        <Route path="/driver-profile" element={<DriverProfile />} />
        <Route path="/parent" element={<Parent />} />
        <Route path="/driver" element={<Driver />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>

      <LogoutConfirmationModal 
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
