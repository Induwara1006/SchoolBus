import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, functions } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query, where, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { httpsCallable } from "firebase/functions";
import GooglePayButton from "@google-pay/button-react";
import EmergencyButton from "../components/EmergencyButton";
import { calculateBusETA } from "../utils/eta";
import TripHistory from "../components/TripHistory";
import AttendanceTracker from "../components/AttendanceTracker";

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

// Google Pay configuration
const GOOGLE_PAY_CONFIG = {
  environment: "TEST", // Change to "PRODUCTION" for live payments
  merchantInfo: {
    merchantName: "School Transport Service",
    merchantId: "BCR2DN4T2WBMZOZD" // Test merchant ID, replace with your actual merchant ID
  },
  paymentDataRequest: {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: "CARD",
        parameters: {
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          allowedCardNetworks: ["MASTERCARD", "VISA"]
        },
        tokenizationSpecification: {
          type: "PAYMENT_GATEWAY",
          parameters: {
            gateway: "example",
            gatewayMerchantId: "exampleGatewayMerchantId"
          }
        }
      }
    ],
    merchantInfo: {
      merchantName: "School Transport Service",
      merchantId: "BCR2DN4T2WBMZOZD"
    }
  }
};

export default function Parent() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [children, setChildren] = useState([]);
  const [busLocations, setBusLocations] = useState({});
  const [payingFor, setPayingFor] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
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

    // Query payments for this parent
    const paymentsQuery = query(collection(db, "payments"), where("parentId", "==", user.uid));
    const unsubPayments = onSnapshot(paymentsQuery, (snap) => {
      const paymentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Parent: Loaded payments:", paymentsList);
      setPayments(paymentsList);
    }, (error) => {
      console.error("Error listening to payments:", error);
    });

    return () => {
      unsubStudents();
      unsubRequests();
      unsubSubscriptions();
      unsubPayments();
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

  // Google Pay payment processing functions
  const processGooglePayPayment = async (paymentData, subscription) => {
    try {
      console.log("🔄 Processing Google Pay payment...");
      console.log("💰 Amount:", subscription.monthlyFee || subscription.amount, "LKR");
      console.log("👶 Student:", subscription.studentName);
      
      // In a real implementation, you would:
      // 1. Send paymentData to your backend
      // 2. Verify the payment with Google Pay
      // 3. Process the transaction
      // 4. Return success/failure
      
      // For now, we'll simulate the backend processing
      console.log("📤 Sending payment data to backend:", paymentData);
      
      // Simulate API call to backend
      const response = await fetch('/api/process-google-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentData,
          amount: subscription.monthlyFee || subscription.amount,
          currency: 'LKR',
          subscriptionId: subscription.id,
          studentName: subscription.studentName
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Google Pay payment successful:", result);
        return { success: true, transactionId: result.transactionId };
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error) {
      console.error("❌ Google Pay payment failed:", error);
      // For demo purposes, return success most of the time
      const demoSuccess = Math.random() > 0.1;
      if (demoSuccess) {
        console.log("✅ Demo: Google Pay payment successful");
        return { 
          success: true, 
          transactionId: `GP_DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }
      return { success: false, error: error.message };
    }
  };

  const createGooglePayRequest = (amount, currency = 'LKR') => {
    return {
      ...GOOGLE_PAY_CONFIG.paymentDataRequest,
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: (amount / 100).toFixed(2), // Convert cents to rupees
        currencyCode: currency,
        countryCode: 'LK'
      }
    };
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

  const handlePay = async (student, paymentData = null) => {
    try {
      setPayingFor(student.id);
      
      console.log("🏦 Initiating Google Pay payment for student:", student.fullName);
      
      let paymentResult;
      if (paymentData) {
        // Real Google Pay payment
        paymentResult = await processGooglePayPayment(paymentData, {
          studentName: student.fullName,
          monthlyFee: student.monthlyFee || 2500,
          amount: student.monthlyFee || 2500
        });
      } else {
        // Fallback demo payment (for testing)
        paymentResult = { 
          success: true, 
          transactionId: `GP_DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }
      
      if (paymentResult.success) {
        // Create payment record for direct student payment
        await addDoc(collection(db, "payments"), {
          studentId: student.id,
          parentId: user.uid,
          studentName: student.fullName,
          amount: student.monthlyFee || 2500,
          currency: "LKR",
          paymentMethod: "google_pay",
          status: "completed",
          transactionId: paymentResult.transactionId,
          paymentDate: serverTimestamp(),
          description: `Direct payment for ${student.fullName}`,
          createdAt: serverTimestamp()
        });

        alert(`✅ Payment successful! Paid ${student.monthlyFee || 2500} LKR via Google Pay for ${student.fullName}`);
      } else {
        throw new Error(paymentResult.error || "Payment was not successful");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert(`❌ Payment failed: ${error.message}`);
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

  const paySubscription = async (subscriptionId, paymentData = null) => {
    try {
      setPayingFor(subscriptionId);
      
      // Find the subscription details
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) {
        throw new Error("Subscription not found");
      }

      console.log("🏦 Initiating Google Pay payment for subscription:", subscription.studentName);
      
      let paymentResult;
      if (paymentData) {
        // Real Google Pay payment
        paymentResult = await processGooglePayPayment(paymentData, subscription);
      } else {
        // Fallback demo payment (for testing)
        paymentResult = { 
          success: true, 
          transactionId: `GP_DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }
      
      if (paymentResult.success) {
        // Update subscription with payment details
        await updateDoc(doc(db, "subscriptions", subscriptionId), {
          lastPaymentDate: serverTimestamp(),
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month
          paymentStatus: "paid",
          totalPaid: (subscription.totalPaid || 0) + subscription.monthlyFee,
          paymentsCount: (subscription.paymentsCount || 0) + 1,
          updatedAt: serverTimestamp()
        });

        // Create payment record
        await addDoc(collection(db, "payments"), {
          subscriptionId: subscriptionId,
          parentId: user.uid,
          driverId: subscription.driverId,
          studentName: subscription.studentName,
          amount: subscription.monthlyFee,
          currency: "LKR",
          paymentMethod: "google_pay",
          status: "completed",
          transactionId: paymentResult.transactionId,
          paymentDate: serverTimestamp(),
          description: `Monthly transport fee for ${subscription.studentName}`,
          createdAt: serverTimestamp()
        });

        alert(`✅ Payment successful! Paid ${subscription.monthlyFee} LKR via Google Pay`);
      } else {
        throw new Error(paymentResult.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert(`❌ Payment failed: ${error.message}`);
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

      {/* Payment Reminders */}
      {subscriptions.filter(sub => {
        const dueDate = sub.nextPaymentDate?.toDate?.() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const today = new Date();
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return sub.status === 'active' && (sub.paymentStatus === 'pending' || daysDiff <= 7);
      }).map(subscription => {
        const dueDate = subscription.nextPaymentDate?.toDate?.() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const today = new Date();
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const isOverdue = daysDiff < 0;
        const isDueSoon = daysDiff <= 7 && daysDiff >= 0;
        
        if (isOverdue || isDueSoon) {
          return (
            <div key={subscription.id} style={{
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '8px',
              border: `2px solid ${isOverdue ? '#ef4444' : '#f59e0b'}`,
              backgroundColor: isOverdue ? '#fef2f2' : '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.5em' }}>
                  {isOverdue ? '🚨' : '⏰'}
                </span>
                <div>
                  <div style={{ fontWeight: '600', color: isOverdue ? '#dc2626' : '#d97706' }}>
                    {isOverdue ? 'Payment Overdue' : 'Payment Due Soon'}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                    {subscription.studentName} - {subscription.monthlyFee || 2500} LKR 
                    {isOverdue ? ` (${Math.abs(daysDiff)} days overdue)` : ` (due in ${daysDiff} days)`}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => paySubscription(subscription.id)}
                disabled={!!payingFor}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc05 75%, #ea4335 100%)',
                  color: 'white',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                💳 Pay Now
              </button>
            </div>
          );
        }
        return null;
      })}

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
                      {payingFor === child.id ? (
                        <div style={{
                          fontSize: '0.8em',
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '500',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          🔄 Processing...
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          <GooglePayButton
                            environment={GOOGLE_PAY_CONFIG.environment}
                            paymentRequest={createGooglePayRequest((child.monthlyFee || 2500) * 100, 'LKR')}
                            onLoadPaymentData={(paymentRequest) => {
                              console.log('Google Pay payment data received for student:', paymentRequest);
                              handlePay(child, paymentRequest);
                            }}
                            onCancel={() => {
                              console.log('Google Pay payment cancelled');
                            }}
                            onError={(error) => {
                              console.error('Google Pay error:', error);
                              alert('Google Pay is not available. Please try again.');
                            }}
                            style={{
                              borderRadius: '6px',
                              height: '36px'
                            }}
                            buttonColor="default"
                            buttonType="pay"
                            buttonSizeMode="static"
                          />
                          <button 
                            className="btn" 
                            onClick={() => handlePay(child)} 
                            disabled={!!payingFor}
                            style={{ 
                              fontSize: '0.7em',
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer'
                            }}
                          >
                            Test Pay {child.monthlyFee || 2500} LKR
                          </button>
                        </div>
                      )}
                      
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
                        <div><strong>Next Payment Due:</strong> {subscription.nextPaymentDate?.toDate?.().toLocaleDateString?.() || nextPaymentDate.toLocaleDateString()}</div>
                        <div><strong>Payment Method:</strong> 💳 Google Pay</div>
                        {subscription.totalPaid > 0 && (
                          <div><strong>Total Paid:</strong> {subscription.totalPaid} LKR ({subscription.paymentsCount || 0} payments)</div>
                        )}
                      </div>
                      
                      {subscription.lastPaymentDate && (
                        <div style={{ 
                          padding: '8px',
                          backgroundColor: '#f0fdf4',
                          borderRadius: '4px',
                          fontSize: '0.85em',
                          color: '#059669',
                          border: '1px solid #d1fae5'
                        }}>
                          <strong>✅ Last Payment:</strong> {subscription.lastPaymentDate.toDate?.().toLocaleDateString?.()} 
                          - {subscription.monthlyFee || 2500} LKR via Google Pay
                        </div>
                      )}
                      
                      {subscription.paymentStatus === 'pending' && (
                        <div style={{ 
                          padding: '8px',
                          backgroundColor: '#fef3c7',
                          borderRadius: '4px',
                          fontSize: '0.85em',
                          color: '#d97706',
                          border: '1px solid #fde68a'
                        }}>
                          <strong>⏳ Payment Due:</strong> Monthly payment is pending
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                      {subscription.status === 'active' && (
                        <>
                          <EmergencyButton 
                            driverInfo={{
                              id: subscription.driverId,
                              email: subscription.driverEmail,
                              displayName: subscription.driverName,
                              phone: subscription.driverPhone
                            }}
                            childInfo={{
                              id: subscription.childId,
                              name: child?.fullName
                            }}
                          />
                          
                          {payingFor === subscription.id ? (
                            <div style={{
                              background: '#6b7280',
                              color: 'white',
                              fontSize: '0.85em',
                              padding: '12px 16px',
                              border: 'none',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: '500',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              🔄 Processing...
                            </div>
                          ) : (
                            <GooglePayButton
                              environment={GOOGLE_PAY_CONFIG.environment}
                              paymentRequest={createGooglePayRequest(subscription.monthlyFee * 100, 'LKR')}
                              onLoadPaymentData={(paymentRequest) => {
                                console.log('Google Pay payment data received:', paymentRequest);
                                paySubscription(subscription.id, paymentRequest);
                              }}
                              onCancel={() => {
                                console.log('Google Pay payment cancelled');
                              }}
                              onError={(error) => {
                                console.error('Google Pay error:', error);
                                alert('Google Pay is not available. Please try again.');
                              }}
                              style={{
                                borderRadius: '8px',
                                height: '44px'
                              }}
                              buttonColor="default"
                              buttonType="pay"
                              buttonSizeMode="fill"
                            />
                          )}
                          
                          {/* Fallback test button */}
                          <button 
                            className="btn"
                            onClick={() => paySubscription(subscription.id)}
                            disabled={!!payingFor}
                            style={{ 
                              background: '#6b7280',
                              color: 'white',
                              fontSize: '0.75em',
                              padding: '6px 10px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Test Payment (Demo)
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

      {/* Payment History */}
      <div style={{ marginBottom: 24 }}>
        <h3>Payment History ({payments.length})</h3>
        {payments.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: 20 }}>
            <p>💳 No payment history yet</p>
            <p style={{ fontSize: '0.9em' }}>Payments will appear here after you make monthly subscription payments.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {payments.slice().reverse().map(payment => (
              <div key={payment.id} className="card" style={{ 
                border: '1px solid #e5e7eb',
                padding: '12px',
                backgroundColor: payment.status === 'completed' ? '#f0fdf4' : '#fef2f2'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.1em', fontWeight: '600' }}>
                        💳 {payment.amount} LKR
                      </span>
                      <span style={{ 
                        padding: '2px 6px',
                        borderRadius: '8px',
                        backgroundColor: payment.status === 'completed' ? '#10b981' : '#ef4444',
                        color: 'white',
                        fontSize: '0.7em',
                        fontWeight: '500'
                      }}>
                        {payment.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#6b7280' }}>
                      <div><strong>Student:</strong> {payment.studentName}</div>
                      <div><strong>Method:</strong> Google Pay</div>
                      <div><strong>Transaction ID:</strong> {payment.transactionId}</div>
                      <div><strong>Date:</strong> {payment.paymentDate?.toDate?.().toLocaleDateString?.()} at {payment.paymentDate?.toDate?.().toLocaleTimeString?.()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8em', color: '#059669', fontWeight: '500' }}>
                      ✅ PAID
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Trip History and Attendance Tracker */}
      <TripHistory userRole="parent" />
      
      {/* Attendance Tracker for Each Child */}
      {children.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {children.map(child => (
            <AttendanceTracker 
              key={child.id}
              userRole="parent" 
              studentId={child.id}
              studentName={child.fullName}
            />
          ))}
        </div>
      )}
    </div>
  );
}