import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth, provider, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Login() {
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (newUser) => {
      // Clear role state when user changes
      if (user && newUser && user.uid !== newUser.uid) {
        // Different user logged in, clear stored role
        localStorage.removeItem('user.role');
        setSelectedRole('');
      } else if (!newUser) {
        // User logged out, clear stored role
        localStorage.removeItem('user.role');
        setSelectedRole('');
      }
      
      setUser(newUser);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    // Load saved role when user changes, or use URL param
    if (user) {
      const urlRole = searchParams.get('role');
      const savedRole = localStorage.getItem('user.role') || '';
      const roleToUse = urlRole || savedRole;
      setSelectedRole(roleToUse);
      
      // Auto-save role from URL if present
      if (urlRole && urlRole !== savedRole) {
        localStorage.setItem('user.role', urlRole);
      }
    } else {
      const urlRole = searchParams.get('role');
      setSelectedRole(urlRole || '');
      
      // Set role from URL parameter even when not logged in
      if (urlRole) {
        localStorage.setItem('user.role', urlRole);
      }
    }
  }, [user, searchParams]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      await saveUserToFirestore(user, selectedRole);
    } catch (e) {
      if (import.meta.env.DEV) console.error('Google login error:', e);
      const code = e?.code || '';
      let hint = '';
      if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
        hint = '\n• Enable the Google provider in Firebase Console > Authentication > Sign-in method.';
      } else if (code === 'auth/unauthorized-domain') {
        hint = '\n• Add localhost and 127.0.0.1 to Authorized domains in Firebase Console > Authentication > Settings.';
      } else if (code === 'auth/invalid-api-key') {
        hint = '\n• Check .env VITE_FIREBASE_* values match your Web app config and restart the dev server.';
      }
      alert(`${e.message || 'Login failed'}${hint}`);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    // Check for role from URL parameter or selected role
    const urlRole = searchParams.get('role');
    const currentRole = urlRole || selectedRole;
    
    if (!email || !password || !currentRole) {
      alert('Please fill in all fields and select a role');
      return;
    }

    setLoading(true);
    try {
      let user;
      
      if (authMode === 'signup') {
        if (!name) {
          alert('Please enter your name');
          setLoading(false);
          return;
        }
        
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
        
        // Update the user's display name
        await updateProfile(user, { displayName: name });
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
      }

      await saveUserToFirestore(user, currentRole);
    } catch (e) {
      if (import.meta.env.DEV) console.error('Email auth error:', e);
      let message = e.message;
      
      if (e.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Try logging in instead.';
      } else if (e.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters long.';
      } else if (e.code === 'auth/user-not-found') {
        message = 'No account found with this email. Try signing up instead.';
      } else if (e.code === 'auth/wrong-password') {
        message = 'Incorrect password. Please try again.';
      }
      
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToFirestore = async (user, role) => {
    try {
      const urlRole = searchParams.get('role');
      const finalRole = urlRole || role || selectedRole;
      
      if (finalRole) {
        localStorage.setItem('user.role', finalRole);
        
        // Store user info in Firestore
        await setDoc(
          doc(db, 'users', user.uid),
          {
            email: user.email,
            displayName: user.displayName || name,
            photoURL: user.photoURL || '',
            role: finalRole,
            lastLogin: serverTimestamp(),
            // Keep existing fields if document already exists
          },
          { merge: true }
        );
        
        // Redirect directly to the appropriate page after login
        if (finalRole === 'driver') {
          navigate('/driver');
        } else if (finalRole === 'parent') {
          navigate('/parent');
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving to Firestore:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all stored role and user data
      localStorage.removeItem('user.role');
      localStorage.removeItem('driver.busId');
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Reset component state
      setSelectedRole('');
      setEmail('');
      setPassword('');
      setName('');
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error signing out:', error);
    }
  };

  const saveRole = () => {
    if (selectedRole) {
      localStorage.setItem('user.role', selectedRole);
      // Navigate to the appropriate page after saving role
      if (selectedRole === 'driver') {
        navigate('/driver');
      } else if (selectedRole === 'parent') {
        navigate('/parent');
      }
    }
  };

  return (
    <div className="card">
      <h3>Login</h3>
      {user ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span className="muted">Signed in as {user.email}</span>
            <button className="btn" onClick={handleLogout}>Sign out</button>
          </div>
          <p className="muted">Redirecting to your dashboard...</p>
        </div>
      ) : (
        <div>
          {/* Role Selection */}
          {!selectedRole && !searchParams.get('role') && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Select your role:
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  className={`btn ${selectedRole === 'driver' ? 'btn-primary' : ''}`}
                  onClick={() => setSelectedRole('driver')}
                >
                  🚌 Driver
                </button>
                <button 
                  className={`btn ${selectedRole === 'parent' ? 'btn-primary' : ''}`}
                  onClick={() => setSelectedRole('parent')}
                >
                  👨‍👩‍👧‍👦 Parent
                </button>
              </div>
            </div>
          )}

          {(selectedRole || searchParams.get('role')) && (
            <div>
              {/* Auth Mode Toggle */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button 
                    className={`btn ${authMode === 'login' ? 'btn-primary' : ''}`}
                    onClick={() => setAuthMode('login')}
                    type="button"
                  >
                    Login
                  </button>
                  <button 
                    className={`btn ${authMode === 'signup' ? 'btn-primary' : ''}`}
                    onClick={() => setAuthMode('signup')}
                    type="button"
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} style={{ marginBottom: 20 }}>
                {authMode === 'signup' && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', marginBottom: 4 }}>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required={authMode === 'signup'}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                )}
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  {loading ? 'Please wait...' : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
                </button>
              </form>

              {/* Divider */}
              <div style={{ textAlign: 'center', marginBottom: 16, position: 'relative' }}>
                <span style={{ background: 'var(--bg)', padding: '0 12px', color: '#666' }}>OR</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#ddd', zIndex: -1 }}></div>
              </div>

              {/* Google Sign In */}
              <button 
                className="btn btn-primary" 
                onClick={handleLogin}
                style={{ width: '100%' }}
              >
                🔗 Sign in with Google
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}