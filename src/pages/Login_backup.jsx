import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth, provider, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Login() {
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

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
    }
  }, [user, searchParams]);		const handleLogin = async () => {
			try {
				console.log('Starting login process...');
				const result = await signInWithPopup(auth, provider);
				const user = result.user;
				console.log('Login successful, user:', user.email);
				
				// Auto-save role from URL if present and redirect
				const urlRole = searchParams.get('role');
				console.log('URL role:', urlRole);
				
				if (urlRole && user) {
					localStorage.setItem('user.role', urlRole);
					
					console.log('Writing to Firestore...');
					// Store user info in Firestore
					await setDoc(
						doc(db, 'users', user.uid),
						{
							email: user.email,
							displayName: user.displayName,
							photoURL: user.photoURL,
							role: urlRole,
							lastLogin: serverTimestamp(),
							// Keep existing fields if document already exists
						},
						{ merge: true }
					);
					console.log('Firestore write successful!');
					
					// Redirect directly to the appropriate page after login
					if (urlRole === 'driver') {
						navigate('/driver');
					} else if (urlRole === 'parent') {
						navigate('/parent');
					}
				}
			} catch (e) {
				console.error('Login error:', e);
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

  const handleLogout = async () => {
    localStorage.removeItem('user.role');
    localStorage.removeItem('driver.busId');
    await signOut(auth);
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
  };		return (
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
						<p className="muted" style={{ marginBottom: 12 }}>
							{selectedRole ? `Sign in as ${selectedRole}` : 'Sign in to access the school transport system'}
						</p>
						<button className="btn btn-primary" onClick={handleLogin}>Sign in with Google</button>
					</div>
				)}
			</div>
		);
}
