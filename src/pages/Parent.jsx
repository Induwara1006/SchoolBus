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

export default function Parent() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [children, setChildren] = useState([]);
  const [busLocation, setBusLocation] = useState(null);
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

        // Subscribe to the first child's bus location (extend to multiple if needed)
        const busId = data[0]?.busId;
        if (!busId) return;
        const locRef = doc(db, "liveLocations", busId);
        onSnapshot(locRef, (locSnap) => {
          setBusLocation(locSnap.data() || null);
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
        <h2>Parent View</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/find-drivers')}
          style={{ fontSize: '0.9em', padding: '8px 16px' }}
        >
          🔍 Find Drivers
        </button>
      </div>

      {/* Status Overview */}
      <div style={{ marginBottom: 20 }}>
        <h3>Your Children</h3>
        {children.length === 0 ? (
          <p className="muted">No students linked to your account yet.</p>
        ) : (
          <ul className="list">
            {children.map((c) => (
              <li key={c.id}>
                <div>
                  <span style={{ fontWeight: 500 }}>{c.fullName}</span>
                  <div className="muted" style={{ fontSize: '0.9em' }}>
                    {c.status === 'in-bus' ? '🚌 Currently in bus' : '🏠 Not in bus'}
                    {c.status === 'in-bus' && busLocation && (
                      <span> • Location updating live</span>
                    )}
                  </div>
                </div>
                <button className="btn" onClick={() => handlePay(c)} disabled={!!payingFor}>
                  {payingFor === c.id ? "Redirecting..." : `Pay ${c.monthlyFee || 2500} LKR`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Live Map - only show when children are in bus */}
      {hasChildrenInBus && (
        <div>
          <h3>Live Bus Location</h3>
          {busLocation ? (
            <div className="map-wrap" style={{ marginBottom: 16 }}>
              <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[busLocation.lat, busLocation.lng]}>
                  <Popup>
                    Bus location<br />
                    Updated: {busLocation.updatedAt?.toDate?.().toLocaleTimeString?.() || ""}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <p className="muted">Waiting for bus location update...</p>
          )}
        </div>
      )}

      {!hasChildrenInBus && children.length > 0 && (
        <div className="muted" style={{ textAlign: 'center', padding: 20 }}>
          <p>📍 Bus location will appear here when your children are picked up</p>
        </div>
      )}
    </div>
  );
}