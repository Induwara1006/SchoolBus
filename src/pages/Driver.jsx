import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import useDriverTracking from '../hooks/useDriverTracking';

export default function Driver() {
  const [user, setUser] = useState(null);
  const [busId, setBusId] = useState('');
  const [students, setStudents] = useState([]);
  const [userRole, setUserRole] = useState('');
  const { isTracking, lastError, toggleTracking } = useDriverTracking();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('driver.busId') || '';
    const role = localStorage.getItem('user.role') || '';
    setBusId(saved);
    setUserRole(role);
  }, []);

  // Load students for this driver's bus
  useEffect(() => {
    if (!user || !busId) return;
    const q = query(collection(db, 'students'), where('busId', '==', busId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudents(data);
    });
    return () => unsub();
  }, [user, busId]);	const saveBusId = () => {
		localStorage.setItem('driver.busId', busId.trim());
		alert('Bus ID saved');
	};

	const toggleStudentStatus = async (student) => {
		const newStatus = student.status === 'in-bus' ? 'not-in-bus' : 'in-bus';
		try {
			await updateDoc(doc(db, 'students', student.id), { status: newStatus });
		} catch (e) {
			alert(`Failed to update student status: ${e.message}`);
		}
	};

	if (userRole !== 'driver') {
		return (
			<div className="card">
				<h3>Driver View</h3>
				<p className="muted">Please select "Driver" role on the <a href="/login">Login page</a> to access this area.</p>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="card">
				<h3>Driver View</h3>
				<p className="muted">Please <a href="/login">login</a> to access the driver dashboard.</p>
			</div>
		);
	}

		return (
			<div className="card">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
					<h3>Driver View</h3>
					<button 
						className="btn btn-primary" 
						onClick={() => navigate('/driver-profile')}
						style={{ fontSize: '0.9em', padding: '8px 16px' }}
					>
						⚙️ Complete Profile
					</button>
				</div>
				<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
					<div className="field" style={{ flex: 1 }}>
						<label className="muted">Bus ID</label>
						<input className="input" value={busId} onChange={(e) => setBusId(e.target.value)} placeholder="e.g., bus-001" />
					</div>
					<button className="btn" onClick={saveBusId}>Save</button>
				</div>
				
				<div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
					<button className="btn btn-primary" onClick={toggleTracking}>{isTracking ? 'Stop' : 'Start'} Tracking</button>
					<span className="muted">Status: {isTracking ? 'Tracking active' : 'Tracking stopped'}</span>
				</div>
				{lastError && <p style={{ color: 'salmon', marginTop: 8 }}>Error: {String(lastError)}</p>}

				<h4 style={{ marginTop: 24, marginBottom: 12 }}>Students on Bus {busId || '(set Bus ID first)'}</h4>
				{students.length === 0 ? (
					<p className="muted">No students assigned to this bus.</p>
				) : (
					<ul className="list">
						{students.map((student) => (
							<li key={student.id}>
								<span>{student.fullName}</span>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span className={`muted ${student.status === 'in-bus' ? '' : 'text-orange'}`}>
										{student.status === 'in-bus' ? '🚌 In bus' : '🏠 Not in bus'}
									</span>
									<button 
										className="btn"
										onClick={() => toggleStudentStatus(student)}
									>
										Mark {student.status === 'in-bus' ? 'Out' : 'In'}
									</button>
								</div>
							</li>
						))}
					</ul>
				)}

				<p className="muted" style={{ marginTop: 12 }}>
					Use location tracking and student status to keep parents informed in real-time.
				</p>
			</div>
		);
}
