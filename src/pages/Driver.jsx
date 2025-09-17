import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, doc, onSnapshot, query, updateDoc, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import useDriverTracking from '../hooks/useDriverTracking';

export default function Driver() {
  const [user, setUser] = useState(null);
  const [busId, setBusId] = useState('');
  const [students, setStudents] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [requests, setRequests] = useState([]);
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
  }, [user, busId]);

  // Load transport requests for this driver
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'transportRequests'), where('driverId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRequests(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    });
    return () => unsub();
  }, [user]);	const saveBusId = () => {
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

	const handleRequestResponse = async (requestId, action) => {
		try {
			await updateDoc(doc(db, 'transportRequests', requestId), {
				status: action,
				respondedAt: serverTimestamp()
			});

			if (action === 'accepted') {
				alert('Request accepted! You can now contact the parent to discuss terms and finalize the agreement.');
			} else {
				alert('Request declined.');
			}
		} catch (error) {
			console.error('Error updating request:', error);
			alert('Failed to update request. Please try again.');
		}
	};

	const addStudentToBus = async (request) => {
		if (!busId) {
			alert('Please set your Bus ID first.');
			return;
		}

		try {
			// Add student to the students collection
			await addDoc(collection(db, 'students'), {
				fullName: request.childName,
				age: request.childAge || '',
				busId: busId,
				parentId: request.parentId,
				pickupAddress: request.pickupAddress,
				dropoffAddress: request.dropoffAddress,
				status: 'not-in-bus',
				monthlyFee: 2500, // Default fee, can be customized
				createdAt: serverTimestamp()
			});

			// Update request status
			await updateDoc(doc(db, 'transportRequests', request.id), {
				status: 'completed',
				studentAdded: true,
				completedAt: serverTimestamp()
			});

			alert(`${request.childName} has been added to your bus route!`);
		} catch (error) {
			console.error('Error adding student:', error);
			alert('Failed to add student. Please try again.');
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

				{/* Transport Requests Section */}
				{requests.length > 0 && (
					<div style={{ marginBottom: 24 }}>
						<h4>📝 Transport Requests ({requests.filter(r => r.status === 'pending').length} pending)</h4>
						{requests.slice(0, 5).map((request) => (
							<div key={request.id} className="card" style={{ marginBottom: 12, padding: 16 }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
									<div style={{ flex: 1 }}>
										<h5 style={{ margin: 0, marginBottom: 8 }}>
											{request.childName} (Parent: {request.parentName})
										</h5>
										<div style={{ fontSize: '0.9em', color: '#666', marginBottom: 8 }}>
											<div>📍 Pickup: {request.pickupAddress}</div>
											<div>🏫 Drop-off: {request.dropoffAddress}</div>
											{request.preferredTime && <div>⏰ Preferred time: {request.preferredTime}</div>}
											{request.additionalNotes && <div>📝 Notes: {request.additionalNotes}</div>}
										</div>
										<span className={`badge ${
											request.status === 'pending' ? 'badge-warning' : 
											request.status === 'accepted' ? 'badge-success' : 'badge-error'
										}`}>
											{request.status.charAt(0).toUpperCase() + request.status.slice(1)}
										</span>
									</div>
									
									<div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
										{request.status === 'pending' && (
											<>
												<button 
													className="btn btn-primary" 
													onClick={() => handleRequestResponse(request.id, 'accepted')}
													style={{ fontSize: '0.8em', padding: '6px 12px' }}
												>
													✅ Accept
												</button>
												<button 
													className="btn" 
													onClick={() => handleRequestResponse(request.id, 'declined')}
													style={{ fontSize: '0.8em', padding: '6px 12px' }}
												>
													❌ Decline
												</button>
											</>
										)}
										{request.status === 'accepted' && !request.studentAdded && (
											<button 
												className="btn btn-primary" 
												onClick={() => addStudentToBus(request)}
												style={{ fontSize: '0.8em', padding: '6px 12px' }}
											>
												➕ Add to Bus
											</button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}

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
