import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, updateDoc, doc, serverTimestamp, addDoc } from "firebase/firestore";

export default function Driver() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [rideRequests, setRideRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'requests', or 'subscriptions'

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "students"));
    const unsub = onSnapshot(q, (s) => {
      const allStudents = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudents(allStudents);
    });

    // Listen for ride requests
    const requestsQuery = query(collection(db, "rideRequests"));
    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Driver: Raw ride requests from Firestore:", requests);
      console.log("Driver: Number of requests:", requests.length);
      requests.forEach((req, index) => {
        console.log(`Driver: Request ${index + 1}:`, {
          id: req.id,
          status: req.status,
          childName: req.childName,
          parentEmail: req.parentEmail,
          createdAt: req.createdAt
        });
      });
      setRideRequests(requests);
    }, (error) => {
      console.error("Driver: Error listening to ride requests:", error);
    });

    // Listen for subscriptions where this driver is assigned
    const subscriptionsQuery = query(collection(db, "subscriptions"));
    const unsubSubscriptions = onSnapshot(subscriptionsQuery, (snap) => {
      const allSubscriptions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Filter subscriptions for this driver
      const driverSubscriptions = allSubscriptions.filter(sub => sub.driverId === user.uid);
      console.log("Driver: Loaded subscriptions:", driverSubscriptions);
      setSubscriptions(driverSubscriptions);
    }, (error) => {
      console.error("Driver: Error listening to subscriptions:", error);
    });

    return () => {
      unsub();
      unsubRequests();
      unsubSubscriptions();
    };
  }, [user]);

  const updateStudentStatus = async (studentId, newStatus) => {
    try {
      await updateDoc(doc(db, "students", studentId), {
        status: newStatus,
        lastStatusUpdate: serverTimestamp(),
        updatedBy: user.uid
      });
    } catch (error) {
      console.error("Error updating student status:", error);
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ["at-home", "picked-up", "in-transit-to-school", "dropped-at-school", "in-transit-to-home", "dropped-at-home"];
    return allStatuses.filter(status => status !== currentStatus);
  };

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

  const handleRequestResponse = async (requestId, status, responseMessage = '') => {
    try {
      console.log("Driver responding to request:", requestId, "with status:", status);
      
      if (status === 'approved') {
        // Find the request details
        const request = rideRequests.find(r => r.id === requestId);
        if (request) {
          // Create ongoing subscription when approving
          await createOngoingSubscription(request);
        }
      }
      
      await updateDoc(doc(db, "rideRequests", requestId), {
        status,
        responseMessage,
        respondedAt: serverTimestamp(),
        respondedBy: user.uid
      });
      console.log("Request response saved successfully");
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request. Please try again.");
    }
  };

  const createOngoingSubscription = async (request) => {
    try {
      // Create a student record if it doesn't exist
      const studentData = {
        fullName: request.childName,
        parentId: request.parentId,
        driverId: user.uid,
        driverEmail: user.email,
        pickupAddress: request.pickupAddress,
        dropoffAddress: request.dropoffAddress,
        status: "at-home",
        monthlyFee: 2500, // Default monthly fee
        subscriptionActive: true,
        subscriptionStartDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        notes: request.notes || ""
      };

      // Add to students collection for ongoing transport
      await addDoc(collection(db, "students"), studentData);
      
      // Create subscription record
      const subscriptionData = {
        studentId: request.childId,
        studentName: request.childName,
        parentId: request.parentId,
        parentEmail: request.parentEmail,
        driverId: user.uid,
        driverEmail: user.email,
        monthlyFee: 2500,
        status: "active",
        startDate: serverTimestamp(),
        pickupAddress: request.pickupAddress,
        dropoffAddress: request.dropoffAddress,
        paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "subscriptions"), subscriptionData);
      
      console.log("Ongoing subscription created successfully");
    } catch (error) {
      console.error("Error creating subscription:", error);
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

  // Filter requests - show both general requests and requests targeted to this driver
  const pendingRequests = rideRequests.filter(r => 
    r.status === 'pending' && 
    (!r.driverId || r.driverId === user?.uid)  // Show general requests OR requests targeted to this driver
  );
  
  // Debug logging for request filtering
  console.log("Driver: Total ride requests:", rideRequests.length);
  console.log("Driver: My driver ID:", user?.uid);
  console.log("Driver: Pending requests for me:", pendingRequests.length);
  console.log("Driver: All request details:", rideRequests.map(r => ({ 
    id: r.id, 
    status: r.status, 
    driverId: r.driverId,
    isForMe: r.driverId === user?.uid || !r.driverId,
    childName: r.childName 
  })));
  
  const approvedRequests = rideRequests.filter(r => r.status === 'approved');
  const allRequests = rideRequests.filter(r => r.status !== 'pending');

  // Test function to create a dummy request for testing
  const createTestRequest = async () => {
    try {
      console.log("Creating test request...");
      const testRequest = {
        childId: "test-child-id",
        childName: "Test Child",
        parentId: "test-parent-id",
        parentEmail: "test@parent.com",
        pickupAddress: "123 Test Street",
        dropoffAddress: "Test School",
        requestType: "regular",
        notes: "This is a test request from driver interface",
        status: "pending",
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "rideRequests"), testRequest);
      console.log("Test request created with ID:", docRef.id);
      alert("Test request created successfully!");
    } catch (error) {
      console.error("Error creating test request:", error);
      alert("Failed to create test request: " + error.message);
    }
  };

  if (!user) return <div className="container">Please sign in.</div>;

  return (
    <div className="container">
      <h2>Driver Panel</h2>
      <div className="driver-info" style={{ background: "#f5f5f5", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0" }}>Driver Profile</h3>
        <p style={{ margin: "4px 0" }}>
          <strong>Name:</strong> {user?.displayName || user?.email || "Driver"}
        </p>
        <p style={{ margin: "4px 0", fontSize: "0.9em", color: "#666" }}>
          Managing daily transport for assigned students
        </p>
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
          Students Count: {students.length}<br/>
          Total Requests: {rideRequests.length}<br/>
          Pending Requests: {pendingRequests.length}
          <div style={{ marginTop: '8px' }}>
            <button 
              onClick={createTestRequest}
              style={{ 
                padding: '4px 8px', 
                fontSize: '0.8em',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Create Test Request
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('students')}
          style={{ 
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: activeTab === 'students' ? '#0d6efd' : '#f5f5f5',
            color: activeTab === 'students' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '0.9em',
            fontWeight: '500'
          }}
        >
          👥 Students ({students.length})
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          style={{ 
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: activeTab === 'requests' ? '#0d6efd' : '#f5f5f5',
            color: activeTab === 'requests' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '0.9em',
            fontWeight: '500',
            position: 'relative'
          }}
        >
          🚌 Ride Requests ({rideRequests.length})
          {pendingRequests.length > 0 && (
            <span style={{ 
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.7em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('subscriptions')}
          style={{ 
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: activeTab === 'subscriptions' ? '#0d6efd' : '#f5f5f5',
            color: activeTab === 'subscriptions' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '0.9em',
            fontWeight: '500'
          }}
        >
          📋 Subscriptions ({subscriptions.length})
        </button>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <>
          <h3 style={{ marginTop: 16 }}>Students ({students.length})</h3>
          <div style={{ fontSize: "0.9em", color: "#666", marginBottom: "12px" }}>
            Click any status button to update a student's current status
          </div>
          
          {students.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              No students found in the database
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {students.map((s) => {
                const currentStatus = s.status || "at-home";
                const availableActions = getStatusOptions(currentStatus);
                
                return (
                  <li key={s.id} style={{ 
                    display: "flex", 
                    flexDirection: "column",
                    gap: 8, 
                    padding: "12px", 
                    marginBottom: "12px",
                    background: "#f9f9f9",
                    borderRadius: "8px",
                    border: "1px solid #eee"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: "1.1em", fontWeight: "600" }}>{s.fullName}</span>
                        <div style={{ fontSize: "0.9em", color: "#666", marginTop: "2px" }}>
                          Age: {s.age || 'N/A'} | School: {s.school || 'N/A'}
                        </div>
                      </div>
                      <div style={{ 
                        padding: "6px 12px",
                        borderRadius: "16px",
                        backgroundColor: getStatusColor(currentStatus),
                        color: "white",
                        fontSize: "0.85em",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        <span>{getStatusIcon(currentStatus)}</span>
                        <span>{getStatusDisplay(currentStatus)}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.9em", fontWeight: "500", marginRight: "8px", alignSelf: "center" }}>
                        Update to:
                      </span>
                      {availableActions.map(action => (
                        <button 
                          key={action}
                          onClick={() => updateStudentStatus(s.id, action)}
                          style={{ 
                            padding: "6px 12px", 
                            fontSize: "0.8em",
                            background: getStatusColor(action),
                            color: "white",
                            border: "none",
                            borderRadius: "16px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <span>{getStatusIcon(action)}</span>
                          <span>{getStatusDisplay(action)}</span>
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Ride Requests Tab */}
      {activeTab === 'requests' && (
        <>
          <h3 style={{ marginTop: 16 }}>Ride Requests</h3>
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⏳ Pending Requests ({pendingRequests.length})
              </h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {pendingRequests.map((request) => (
                  <div key={request.id} style={{ 
                    padding: '16px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #f59e0b'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.1em', fontWeight: '600' }}>
                            {request.childName}
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
                          {request.driverId === user?.uid && (
                            <span style={{ 
                              padding: '4px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              fontSize: '0.8em',
                              fontWeight: '500'
                            }}>
                              🎯 TARGETED TO YOU
                            </span>
                          )}
                        </div>
                        
                        <div style={{ fontSize: '0.9em', marginBottom: '8px' }}>
                          <div><strong>Parent:</strong> {request.parentEmail}</div>
                          <div><strong>From:</strong> {request.pickupAddress}</div>
                          <div><strong>To:</strong> {request.dropoffAddress}</div>
                          {request.notes && (
                            <div><strong>Notes:</strong> {request.notes}</div>
                          )}
                          <div style={{ fontSize: '0.8em', color: '#666', marginTop: '8px' }}>
                            🕒 Requested: {request.createdAt?.toDate?.().toLocaleString?.() || 'Unknown'}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button 
                            onClick={() => handleRequestResponse(request.id, 'approved', 'Request approved by driver')}
                            style={{ 
                              padding: '8px 16px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9em'
                            }}
                          >
                            ✅ Approve
                          </button>
                          <button 
                            onClick={() => handleRequestResponse(request.id, 'rejected', 'Request rejected by driver')}
                            style={{ 
                              padding: '8px 16px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9em'
                            }}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Requests History */}
          {allRequests.length > 0 && (
            <div>
              <h4>📋 Request History ({allRequests.length})</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {allRequests.map((request) => (
                  <div key={request.id} style={{ 
                    padding: '16px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
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
                        </div>
                        
                        <div style={{ fontSize: '0.9em' }}>
                          <div><strong>Parent:</strong> {request.parentEmail}</div>
                          <div><strong>From:</strong> {request.pickupAddress}</div>
                          <div><strong>To:</strong> {request.dropoffAddress}</div>
                          {request.responseMessage && (
                            <div style={{ 
                              marginTop: '8px', 
                              padding: '8px', 
                              backgroundColor: '#f3f4f6', 
                              borderRadius: '4px'
                            }}>
                              <strong>Response:</strong> {request.responseMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rideRequests.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              No ride requests yet
            </div>
          )}
        </>
      )}
    </div>
  );
}
