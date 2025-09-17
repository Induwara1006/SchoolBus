import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login.jsx';
import Parent from './pages/Parent.jsx';
import Driver from './pages/Driver.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="header">
          <div className="brand">
            <span className="brand-badge" />
            <span>School Transport</span>
          </div>
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/parent">Parent</Link>
            <Link to="/driver">Driver</Link>
          </nav>
        </header>

        <div className="content">
        <Routes>
          <Route
            path="/"
            element={
              <div className="card">
                <h3>School Transport System</h3>
                <h4 style={{ marginTop: 20, marginBottom: 16 }}>Select your role</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                  <Link className="btn btn-primary" to="/login?role=driver" style={{ padding: '20px 24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '1.5em', fontWeight: 'bold', minWidth: '30px' }}>1.</span>
                    <div>
                      <div style={{ fontSize: '1.1em', fontWeight: 600 }}>Driver</div>
                      <div style={{ fontSize: '0.9em', opacity: 0.8, marginTop: 4 }}>
                        Track location & manage students
                      </div>
                    </div>
                  </Link>
                  <Link className="btn btn-primary" to="/login?role=parent" style={{ padding: '20px 24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '1.5em', fontWeight: 'bold', minWidth: '30px' }}>2.</span>
                    <div>
                      <div style={{ fontSize: '1.1em', fontWeight: 600 }}>Parent</div>
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
          <Route path="/parent" element={<Parent />} />
          <Route path="/driver" element={<Driver />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
