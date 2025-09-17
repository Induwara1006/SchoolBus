import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, functions } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
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
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('user.role') || '';
    setUserRole(role);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const u = await getDoc(doc(db, "users", user.uid));
      if (!u.exists()) return;
      const studentIds = u.data().parentOf || [];
      if (studentIds.length === 0) return;

      const q = query(collection(db, "students"), where("__name__", "in", studentIds.slice(0, 10)));
      // Firestore 'in' supports up to 10 items; in production, batch if more.
      onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
      });
    })();
  }, [user]);

  const center = busLocation ? [busLocation.lat, busLocation.lng] : [6.9271, 79.8612]; // default Colombo

  const createCheckout = useMemo(() => httpsCallable(functions, "createCheckoutSession"), []);

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
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/find-drivers')}
          style={{ fontSize: '0.9em', padding: '8px 16px' }}
        >
          🔍 Find Drivers
        </button>
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
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: config.color,
                        color: 'white',
                        fontSize: '0.8em',
                        fontWeight: '500',
                        marginBottom: '8px'
                      }}>
                        {config.label}
                      </div>
                      
                      <div className="muted" style={{ fontSize: '0.9em' }}>
                        <div>Age: {child.age || 'Not specified'}</div>
                        <div>School: {child.school || 'Not specified'}</div>
                        {child.busId && (
                          <div>Bus ID: {child.busId}</div>
                        )}
                        {busLocation && (
                          <div>
                            📍 Last updated: {busLocation.updatedAt?.toDate?.().toLocaleTimeString?.() || 'Unknown'}
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