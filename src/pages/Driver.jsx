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
  }, [user]);

  const updateStudentStatus = async (studentId, newStatus) => {
    try {
      await updateDoc(doc(db, 'students', studentId), {
        status: newStatus,
        lastStatusUpdate: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating student status:', error);
      alert('Failed to update student status');
    }
  };

  const statusOptions = [
    { value: 'at-home', label: '🏠 At Home', color: '#6b7280' },
    { value: 'waiting-pickup', label: '⏰ Waiting for Pickup', color: '#f59e0b' },
    { value: 'picked-up', label: '🚌 Picked Up', color: '#3b82f6' },
    { value: 'in-transit', label: '🚛 In Transit', color: '#8b5cf6' },
    { value: 'at-school', label: '🏫 At School', color: '#10b981' },
    { value: 'returning', label: '🔄 Returning Home', color: '#f97316' },
    { value: 'dropped-off', label: '✅ Dropped Off', color: '#059669' }
  ];	const saveBusId = () => {
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
				status: 'at-home',
				monthlyFee: 2500, // Default fee, can be customized
				createdAt: serverTimestamp(),
				lastStatusUpdate: serverTimestamp()
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
					<div style={{ display: 'grid', gap: '12px' }}>
						{students.map((student) => {
							const currentStatus = student.status || 'at-home';
							const statusOption = statusOptions.find(opt => opt.value === currentStatus) || statusOptions[0];
							
							return (
								<div key={student.id} className="card" style={{ 
									padding: '12px',
									border: `2px solid ${statusOption.color}20`,
									borderLeft: `4px solid ${statusOption.color}`
								}}>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<div style={{ flex: 1 }}>
											<div style={{ fontWeight: '600', marginBottom: '4px' }}>
												{student.fullName}
											</div>
											<div style={{ fontSize: '0.9em', color: 'var(--muted)', marginBottom: '8px' }}>
												<div>Age: {student.age || 'Not specified'}</div>
												<div>📍 Pickup: {student.pickupAddress || 'Not specified'}</div>
											</div>
											<div style={{
												display: 'inline-block',
												padding: '4px 8px',
												borderRadius: '12px',
												backgroundColor: statusOption.color,
												color: 'white',
												fontSize: '0.75em',
												fontWeight: '500'
											}}>
												{statusOption.label}
											</div>
										</div>
										
										<div style={{ marginLeft: '12px' }}>
											<select 
												value={currentStatus}
												onChange={(e) => updateStudentStatus(student.id, e.target.value)}
												style={{
													padding: '6px 8px',
													borderRadius: '6px',
													border: '1px solid var(--border)',
													background: 'var(--input-bg)',
													color: 'var(--text)',
													fontSize: '0.8em'
												}}
											>
												{statusOptions.map(option => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}

				<p className="muted" style={{ marginTop: 16 }}>
					💡 Update student status in real-time to keep parents informed. Location tracking shows bus position on parent dashboards.
				</p>
			</div>
		);
}
