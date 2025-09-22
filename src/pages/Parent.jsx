import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, functions } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { httpsCallable } from "firebase/functions";

// Status mapping for better display
const statusConfig = {
  'at-home': { label: 'At Home', color: '#6b7280', icon: '🏠' },
  'waiting-pickup': { label: 'Waiting for Pickup', color: '#f59e0b', icon: '⏰' },
  'picked-up': { label: 'Picked Up', color: '#3b82f6', icon: '🚌' },
  'in-transit': { label: 'In Transit', color: '#8b5cf6', icon: '🚛' },
  'at-school': { label: 'At School', color: '#10b981', icon: '🏫' },
  'returning': { label: 'Returning Home', color: '#f97316', icon: '🔄' },
  'dropped-off': { label: 'Dropped Off', color: '#059669', icon: '✅' }
};

export default function Parent() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [children, setChildren] = useState([]);
  const [busLocations, setBusLocations] = useState({});
  const [payingFor, setPayingFor] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    childId: '',
    pickupAddress: '',
    dropoffAddress: '',
    requestType: 'regular', // regular, emergency
    notes: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Clear role if user changed
      if (!u) {
        setUserRole('');
        localStorage.removeItem('user.role');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Only set role if we have a user
    if (user) {
      const role = localStorage.getItem('user.role') || '';
      setUserRole(role);
    } else {
      setUserRole('');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    // Query students where parentId matches the current user's uid
    const q = query(collection(db, "students"), where("parentId", "==", user.uid));
    const unsubStudents = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Parent: Loaded students:", data);
      setChildren(data);

      // Subscribe to bus locations for all children's buses
      const busIds = [...new Set(data.map(child => child.busId).filter(Boolean))];
      const locations = {};
      
      busIds.forEach(busId => {
        const locRef = doc(db, "liveLocations", busId);
        onSnapshot(locRef, (locSnap) => {
          if (locSnap.exists()) {
            locations[busId] = locSnap.data();
            setBusLocations({...locations});
          }
        });
      });
    }, (error) => {
      console.error("Error loading students:", error);
    });

    // Query ride requests for this parent
    const requestsQuery = query(collection(db, "rideRequests"), where("parentId", "==", user.uid));
    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Parent: Loaded ride requests:", requests);
      setRideRequests(requests);
    }, (error) => {
      console.error("Error listening to ride requests:", error);
    });

    // Query subscriptions for this parent
    const subscriptionsQuery = query(collection(db, "subscriptions"), where("parentId", "==", user.uid));
    const unsubSubscriptions = onSnapshot(subscriptionsQuery, (snap) => {
      const subs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Parent: Loaded subscriptions:", subs);
      setSubscriptions(subs);
    }, (error) => {
      console.error("Error listening to subscriptions:", error);
    });

    return () => {
      unsubStudents();
      unsubRequests();
      unsubSubscriptions();
    };
  }, [user]);

  // Get center location from any available bus location or default to Colombo
  const center = useMemo(() => {
    const availableLocations = Object.values(busLocations);
    if (availableLocations.length > 0) {
      const firstLocation = availableLocations[0];
      return [firstLocation.lat, firstLocation.lng];
    }
    return [6.9271, 79.8612]; // default Colombo
  }, [busLocations]);

  const createCheckout = useMemo(() => httpsCallable(functions, "createCheckoutSession"), []);

  const getStatusDisplay = (status) => {
    const displays = {
      "at-home": "At Home",
      "picked-up": "Picked Up",
      "in-transit-to-school": "Going to School", 
      "dropped-at-school": "At School",
      "in-transit-to-home": "Going Home",
      "dropped-at-home": "Dropped at Home"
    };
    return displays[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      "at-home": "#6c757d",
      "picked-up": "#fd7e14", 
      "in-transit-to-school": "#0d6efd",
      "dropped-at-school": "#198754",
      "in-transit-to-home": "#0d6efd", 
      "dropped-at-home": "#198754"
    };
    return colors[status] || "#6c757d";
  };

  const getStatusIcon = (status) => {
    const icons = {
      "at-home": "🏠",
      "picked-up": "🚌",
      "in-transit-to-school": "🚌➡️🏫", 
      "dropped-at-school": "🏫",
      "in-transit-to-home": "🚌➡️🏠",
      "dropped-at-home": "✅"
    };
    return icons[status] || "📍";
  };

  const handlePay = async (student) => {
    try {
      setPayingFor(student.id);
      const month = new Date().toLocaleString(undefined, { month: "long", year: "numeric" });
      const res = await createCheckout({
        studentId: student.id,
        month,
        amount: student.monthlyFee || 2500,
        currency: "lkr",
        successUrl: window.location.origin + "/parent?paid=1",
        cancelUrl: window.location.origin + "/parent?canceled=1",
      });
      const url = res?.data?.url;
      if (url) {
        window.location.assign(url);
      }
    } catch (e) {
      console.error(e);
      alert(e.message || "Payment init failed");
    } finally {
      setPayingFor(null);
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    const confirmed = window.confirm("Are you sure you want to cancel this subscription? This will stop the daily transport service.");
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, "subscriptions", subscriptionId), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        cancelledBy: user.uid
      });
      alert("Subscription cancelled successfully");
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    }
  };

  const paySubscription = async (subscription) => {
    try {
      setPayingFor(subscription.id);
      const month = new Date().toLocaleString(undefined, { month: "long", year: "numeric" });
      const res = await createCheckout({
        subscriptionId: subscription.id,
        studentName: subscription.studentName,
        month,
        amount: subscription.monthlyFee || 2500,
        currency: "lkr",
        successUrl: window.location.origin + "/parent?paid=1",
        cancelUrl: window.location.origin + "/parent?canceled=1",
      });
      const url = res?.data?.url;
      if (url) {
        window.location.assign(url);
      }
    } catch (e) {
      console.error(e);
      alert(e.message || "Payment init failed");
    } finally {
      setPayingFor(null);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.childId || !requestData.pickupAddress || !requestData.dropoffAddress) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const selectedChild = children.find(c => c.id === requestData.childId);
      console.log("Creating ride request with data:", {
        ...requestData,
        parentId: user.uid,
        parentEmail: user.email,
        childName: selectedChild?.fullName || 'Unknown'
      });
      
      const docRef = await addDoc(collection(db, "rideRequests"), {
        ...requestData,
        parentId: user.uid,
        parentEmail: user.email,
        childName: selectedChild?.fullName || 'Unknown',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      console.log("✅ PARENT: Ride request created successfully with ID:", docRef.id);
      console.log("✅ PARENT: Request should appear in driver dashboard immediately");
      
      // Reset form
      setRequestData({
        childId: '',
        pickupAddress: '',
        dropoffAddress: '',
        requestType: 'regular',
        notes: ''
      });
      setShowRequestForm(false);
      alert("Ride request sent successfully!");
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request. Please try again.");
    }
  };

  const getRequestStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'approved': '#10b981',
      'rejected': '#ef4444',
      'completed': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getRequestStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'approved': '✅',
      'rejected': '❌',
      'completed': '🏁'
    };
    return icons[status] || '📋';
  };

  const createTestStudent = async () => {
    try {
      const testStudent = {
        fullName: "Test Student",
        age: 8,
        school: "Test School",
        parentId: user.uid,
        status: "at-home",
        monthlyFee: 2500,
        createdAt: serverTimestamp()
      };
      
      console.log("Creating test student:", testStudent);
      const docRef = await addDoc(collection(db, "students"), testStudent);
      console.log("Test student created with ID:", docRef.id);
      alert("Test student created successfully!");
    } catch (error) {
      console.error("Error creating test student:", error);
      alert("Failed to create test student: " + error.message);
    }
  };

  const childrenInBus = children.filter(c => c.status === 'in-bus');
  const hasChildrenInBus = childrenInBus.length > 0;

  if (userRole !== 'parent') {
    return (
      <div className="card">
        <h2>Parent View</h2>
        <p className="muted">Please select "Parent" role on the <a href="/login">Login page</a> to access this area.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card">
        <h2>Parent View</h2>
        <p className="muted">Please <a href="/login">login</a> to view your children and bus location.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Parent Dashboard</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn" 
            onClick={() => setShowRequestForm(!showRequestForm)}
            style={{ fontSize: '0.9em', padding: '8px 16px', backgroundColor: '#10b981', color: 'white' }}
          >
            🚌 Request Ride
          </button>
          <button 
            className="btn" 
            onClick={() => navigate('/subscriptions')}
            style={{ fontSize: '0.9em', padding: '8px 16px' }}
          >
            💳 Subscriptions
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/find-drivers')}
            style={{ fontSize: '0.9em', padding: '8px 16px' }}
          >
            🔍 Find Drivers
          </button>
        </div>
      </div>

      {/* Debug Information */}
      {user && (
        <div style={{ 
          background: '#f0f0f0', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '16px',
          fontSize: '0.9em',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Info:</strong><br/>
          User ID: {user.uid}<br/>
          Children Count: {children.length}<br/>
          Requests Count: {rideRequests.length}<br/>
          Current Role: {userRole}
          {children.length === 0 && (
            <div style={{ marginTop: '8px' }}>
              <button 
                onClick={createTestStudent}
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '0.8em',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Test Student
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ride Request Form */}
      {showRequestForm && (
        <div className="card" style={{ marginBottom: 24, border: '2px solid #10b981' }}>
          <h3>🚌 Request a Ride</h3>
          <form onSubmit={handleRequestSubmit}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Select Child *
                </label>
                <select 
                  value={requestData.childId} 
                  onChange={(e) => setRequestData({...requestData, childId: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  required
                >
                  <option value="">Choose a child...</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>{child.fullName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Pickup Address *
                </label>
                <input 
                  type="text"
                  value={requestData.pickupAddress}
                  onChange={(e) => setRequestData({...requestData, pickupAddress: e.target.value})}
                  placeholder="Enter pickup location..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Drop-off Address *
                </label>
                <input 
                  type="text"
                  value={requestData.dropoffAddress}
                  onChange={(e) => setRequestData({...requestData, dropoffAddress: e.target.value})}
                  placeholder="Enter drop-off location..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Request Type
                </label>
                <select 
                  value={requestData.requestType} 
                  onChange={(e) => setRequestData({...requestData, requestType: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="regular">Regular Transport</option>
                  <option value="emergency">Emergency Request</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Additional Notes
                </label>
                <textarea 
                  value={requestData.notes}
                  onChange={(e) => setRequestData({...requestData, notes: e.target.value})}
                  placeholder="Any special instructions or notes..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn" style={{ backgroundColor: '#10b981', color: 'white' }}>
                  Send Request
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowRequestForm(false)}
                  className="btn"
                  style={{ backgroundColor: '#6b7280', color: 'white' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Pending Ride Requests */}
      <div style={{ marginBottom: 24 }}>
        <h3>Your Ride Requests ({rideRequests.length})</h3>
        {rideRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            No ride requests yet. Click "Request Ride" to send your first request.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {rideRequests.map((request) => (
              <div key={request.id} className="card" style={{ 
                padding: '16px',
                border: `2px solid ${getRequestStatusColor(request.status)}20`,
                borderLeft: `4px solid ${getRequestStatusColor(request.status)}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.1em', fontWeight: '600' }}>
                        {request.childName}
                      </span>
                      <span style={{ 
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: getRequestStatusColor(request.status),
                        color: 'white',
                        fontSize: '0.8em',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{getRequestStatusIcon(request.status)}</span>
                        <span>{request.status.toUpperCase()}</span>
                      </span>
                      {request.requestType === 'emergency' && (
                        <span style={{ 
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontSize: '0.8em',
                          fontWeight: '500'
                        }}>
                          🚨 EMERGENCY
                        </span>
                      )}
                    </div>
                    
                    <div className="muted" style={{ fontSize: '0.9em' }}>
                      <div><strong>From:</strong> {request.pickupAddress}</div>
                      <div><strong>To:</strong> {request.dropoffAddress}</div>
                      {request.notes && (
                        <div><strong>Notes:</strong> {request.notes}</div>
                      )}
                      <div style={{ fontSize: '0.8em', color: '#666', marginTop: '8px' }}>
                        🕒 Requested: {request.createdAt?.toDate?.().toLocaleString?.() || 'Unknown'}
                      </div>
                      {request.responseMessage && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '8px', 
                          backgroundColor: '#f3f4f6', 
                          borderRadius: '4px',
                          fontSize: '0.9em'
                        }}>
                          <strong>Driver Response:</strong> {request.responseMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Children Status Cards */}
      <div style={{ marginBottom: 24 }}>
        <h3>Your Children</h3>
        {children.length === 0 ? (
          <p className="muted">No students linked to your account yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {children.map((child) => {
              const status = child.status || 'at-home';
              const config = statusConfig[status] || statusConfig['at-home'];
              const busLocation = child.busId ? busLocations[child.busId] : null;
              
              return (
                <div key={child.id} className="card" style={{ 
                  padding: '16px',
                  border: `2px solid ${config.color}20`,
                  borderLeft: `4px solid ${config.color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.1em', fontWeight: '600' }}>{child.fullName}</span>
                        <span style={{ fontSize: '1.2em' }}>{config.icon}</span>
                      </div>
                      
                      <div style={{ 
                        padding: '6px 12px',
                        borderRadius: '16px',
                        backgroundColor: getStatusColor(child.status || "at-home"),
                        color: 'white',
                        fontSize: '0.85em',
                        fontWeight: '500',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>{getStatusIcon(child.status || "at-home")}</span>
                        <span>{getStatusDisplay(child.status || "at-home")}</span>
                      </div>
                      
                      <div className="muted" style={{ fontSize: '0.9em' }}>
                        <div>Age: {child.age || 'Not specified'}</div>
                        <div>School: {child.school || 'Not specified'}</div>
                        {child.busId && (
                          <div>Bus ID: {child.busId}</div>
                        )}
                        {child.lastStatusUpdate && (
                          <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                            🕒 Last updated: {child.lastStatusUpdate?.toDate?.().toLocaleString?.() || 'Unknown'}
                          </div>
                        )}
                        {busLocation && (
                          <div style={{ fontSize: '0.8em', color: '#666' }}>
                            📍 Bus location updated: {busLocation.updatedAt?.toDate?.().toLocaleTimeString?.() || 'Unknown'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <button 
                        className="btn" 
                        onClick={() => handlePay(child)} 
                        disabled={!!payingFor}
                        style={{ fontSize: '0.8em' }}
                      >
                        {payingFor === child.id ? "Processing..." : `Pay ${child.monthlyFee || 2500} LKR`}
                      </button>
                      
                      {busLocation && (
                        <span style={{ 
                          fontSize: '0.8em', 
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          🟢 Live tracking active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Subscriptions */}
      <div style={{ marginBottom: 24 }}>
        <h3>Active Subscriptions ({subscriptions.length})</h3>
        {subscriptions.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: 20 }}>
            <p>📋 No active subscriptions</p>
            <p style={{ fontSize: '0.9em' }}>Once a driver approves your ride request, an ongoing monthly subscription will be created.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {subscriptions.map(subscription => {
              const child = children.find(c => c.id === subscription.childId);
              const nextPaymentDate = new Date();
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
              
              return (
                <div key={subscription.id} className="card" style={{ 
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  backgroundColor: subscription.status === 'active' ? '#f0fdf4' : '#fef2f2'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, color: '#1f2937' }}>
                          🚌 {child?.fullName || 'Child'} - Transport Service
                        </h4>
                        <span style={{ 
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: subscription.status === 'active' ? '#10b981' : '#ef4444',
                          color: 'white',
                          fontSize: '0.75em',
                          fontWeight: '500'
                        }}>
                          {subscription.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: '12px', color: '#6b7280', fontSize: '0.9em' }}>
                        <div><strong>Driver:</strong> {subscription.driverName || 'Unknown'}</div>
                        <div><strong>Route:</strong> {subscription.pickupAddress} → {subscription.dropoffAddress}</div>
                        <div><strong>Monthly Fee:</strong> {subscription.monthlyFee || 2500} LKR</div>
                        <div><strong>Started:</strong> {subscription.createdAt?.toDate?.().toLocaleDateString?.() || 'Unknown'}</div>
                        <div><strong>Next Payment:</strong> {nextPaymentDate.toLocaleDateString()}</div>
                      </div>
                      
                      {subscription.lastPayment && (
                        <div style={{ 
                          padding: '8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '0.85em',
                          color: '#374151'
                        }}>
                          <strong>Last Payment:</strong> {subscription.lastPayment.toDate?.().toLocaleDateString?.()} 
                          - {subscription.monthlyFee || 2500} LKR
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                      {subscription.status === 'active' && (
                        <>
                          <button 
                            className="btn"
                            onClick={() => paySubscription(subscription.id)}
                            disabled={!!payingFor}
                            style={{ 
                              backgroundColor: '#10b981', 
                              color: 'white',
                              fontSize: '0.85em',
                              padding: '8px 12px'
                            }}
                          >
                            {payingFor === subscription.id ? "Processing..." : `Pay ${subscription.monthlyFee || 2500} LKR`}
                          </button>
                          <button 
                            className="btn"
                            onClick={() => cancelSubscription(subscription.id)}
                            style={{ 
                              backgroundColor: '#ef4444', 
                              color: 'white',
                              fontSize: '0.85em',
                              padding: '8px 12px'
                            }}
                          >
                            Cancel Subscription
                          </button>
                        </>
                      )}
                      
                      {subscription.status === 'cancelled' && (
                        <span style={{ 
                          fontSize: '0.85em',
                          color: '#6b7280',
                          fontStyle: 'italic'
                        }}>
                          Cancelled on {subscription.cancelledAt?.toDate?.().toLocaleDateString?.()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Map - show all bus locations */}
      {Object.keys(busLocations).length > 0 && (
        <div>
          <h3>Live Bus Locations</h3>
          <div className="map-wrap" style={{ marginBottom: 16 }}>
            <MapContainer 
              center={Object.values(busLocations)[0] ? 
                [Object.values(busLocations)[0].lat, Object.values(busLocations)[0].lng] : 
                [6.9271, 79.8612]
              } 
              zoom={13} 
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {Object.entries(busLocations).map(([busId, location]) => (
                <Marker key={busId} position={[location.lat, location.lng]}>
                  <Popup>
                    <div>
                      <strong>Bus {busId}</strong><br />
                      Children: {children.filter(c => c.busId === busId).map(c => c.fullName).join(', ')}<br />
                      Last update: {location.updatedAt?.toDate?.().toLocaleTimeString?.() || "Unknown"}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Show message when no active tracking */}
      {Object.keys(busLocations).length === 0 && children.length > 0 && (
        <div className="muted" style={{ textAlign: 'center', padding: 20 }}>
          <p>📍 Bus location will appear here when your children are picked up</p>
        </div>
      )}
    </div>
  );
}