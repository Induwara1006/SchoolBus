import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function FindDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchArea, setSearchArea] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [user, setUser] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [requestData, setRequestData] = useState({
    childName: '',
    childAge: '',
    pickupAddress: '',
    dropoffAddress: '',
    preferredTime: '',
    additionalNotes: ''
  });

  useEffect(() => {


    const unsubscribe = onAuthStateChanged(auth, setUser);
    fetchDrivers();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Filter drivers based on search area
    if (searchArea.trim() === '') {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(driver => 
        driver.area?.toLowerCase().includes(searchArea.toLowerCase()) ||
        driver.route?.toLowerCase().includes(searchArea.toLowerCase()) ||
        driver.school?.toLowerCase().includes(searchArea.toLowerCase())
      );
      setFilteredDrivers(filtered);
    }
  }, [searchArea, drivers]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);

      const q = query(collection(db, 'users'), where('role', '==', 'driver'));
      const querySnapshot = await getDocs(q);

      const driverList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        if (data.isAvailable !== false) { // Only show available drivers
          driverList.push({
            id: doc.id,
            ...data
          });
        }
      });

      setDrivers(driverList);
      setFilteredDrivers(driverList);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleContactDriver = (driver) => {
    const message = `Hi ${driver.displayName}, I'm interested in school bus service for my child. Could you please provide more details about your service?`;
    
    if (driver.phone) {
      // WhatsApp integration
      const whatsappUrl = `https://wa.me/${driver.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else if (driver.email) {
      // Email fallback
      const emailUrl = `mailto:${driver.email}?subject=School Bus Service Inquiry&body=${encodeURIComponent(message)}`;
      window.open(emailUrl, '_blank');
    } else {
      alert('Contact information not available for this driver.');
    }
  };

  const handleSendRequest = (driver) => {
    if (!user) {
      alert('Please login to send a request to drivers.');
      return;
    }
    setSelectedDriver(driver);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {




    if (!selectedDriver || !user) {

      return;
    }
    
    // Validate required fields
    if (!requestData.childName || !requestData.pickupAddress || !requestData.dropoffAddress) {

      alert('Please fill in all required fields.');
      return;
    }

    try {


      const docRef = await addDoc(collection(db, 'rideRequests'), {
        driverId: selectedDriver.id,
        driverName: selectedDriver.displayName,
        parentId: user.uid,
        parentName: user.displayName || user.email,
        parentEmail: user.email,
        childName: requestData.childName,
        childAge: requestData.childAge,
        pickupAddress: requestData.pickupAddress,
        dropoffAddress: requestData.dropoffAddress,
        preferredTime: requestData.preferredTime,
        additionalNotes: requestData.additionalNotes,
        status: 'pending',
        createdAt: serverTimestamp(),
        requestMessage: `I would like to request transport service for my child ${requestData.childName}. Please review the details and let me know if you can provide this service.`,
        requestType: 'targeted', // Mark as targeted request to specific driver
        notes: requestData.additionalNotes
      });


      alert('Request sent successfully! The driver will review your request and respond.');
      setShowRequestModal(false);
      setRequestData({
        childName: '',
        childAge: '',
        pickupAddress: '',
        dropoffAddress: '',
        preferredTime: '',
        additionalNotes: ''
      });
    } catch (error) {





      alert(`Failed to send request: ${error.message}. Please try again.`);
    }
  };

  const DriverCard = ({ driver }) => (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {driver.photoURL && (
          <img 
            src={driver.photoURL} 
            alt={driver.displayName}
            style={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              objectFit: 'cover' 
            }}
          />
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <h4 style={{ margin: 0, marginBottom: 4 }}>{driver.displayName || 'Driver'}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge" style={{ backgroundColor: '#10b981', color: 'white' }}>
                  ⭐ {driver.rating || '4.5'} ({driver.reviews || '12'} reviews)
                </span>
                <span className="badge">
                  🚌 Bus #{driver.busNumber || driver.driverOfBusId || 'TBD'}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-primary"
                onClick={() => handleSendRequest(driver)}
                style={{ fontSize: '0.9em', padding: '8px 16px' }}
              >
                📝 Send Request
              </button>
              <button 
                className="btn"
                onClick={() => handleContactDriver(driver)}
                style={{ fontSize: '0.9em', padding: '8px 16px' }}
              >
                📞 Contact
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {driver.area && (
                <div>
                  <strong>📍 Service Area:</strong> {driver.area}
                </div>
              )}
              {driver.school && (
                <div>
                  <strong>🏫 School:</strong> {driver.school}
                </div>
              )}
              {driver.capacity && (
                <div>
                  <strong>👥 Capacity:</strong> {driver.capacity} students
                </div>
              )}
              {driver.price && (
                <div>
                  <strong>💰 Price:</strong> ${driver.price}/month
                </div>
              )}
            </div>
          </div>

          {driver.route && (
            <div style={{ marginBottom: 12 }}>
              <strong>🛣️ Route:</strong> {driver.route}
            </div>
          )}

          {driver.schedule && (
            <div style={{ marginBottom: 12 }}>
              <strong>⏰ Schedule:</strong> {driver.schedule}
            </div>
          )}

          {driver.description && (
            <div>
              <strong>ℹ️ About:</strong> {driver.description}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {driver.hasFirstAid && (
              <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                🩹 First Aid Certified
              </span>
            )}
            {driver.hasInsurance && (
              <span className="badge" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                🛡️ Insured
              </span>
            )}
            {driver.yearsExperience && (
              <span className="badge">
                📅 {driver.yearsExperience} years experience
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div style={{ marginBottom: 24 }}>
        <h3>Find School Bus Drivers</h3>
        <p className="muted">Connect with qualified drivers in your area</p>
        
        <div style={{ marginTop: 16 }}>
          <input
            type="text"
            placeholder="Search by area, school, or route..."
            value={searchArea}
            onChange={(e) => setSearchArea(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '1em'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div>Loading available drivers...</div>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2em', marginBottom: 16 }}>🚌</div>
          <h4>No drivers found</h4>
          <p className="muted">
            {searchArea ? 'Try adjusting your search criteria' : 'No drivers are currently available in our system'}
          </p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 16, color: 'var(--muted)' }}>
            Found {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''}
            {searchArea && ` matching "${searchArea}"`}
          </div>
          
          {filteredDrivers.map((driver) => (
            <DriverCard key={driver.id} driver={driver} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
        <h5>💡 Tips for Parents:</h5>
        <ul style={{ marginLeft: 16, color: 'var(--muted)' }}>
          <li>Check driver ratings and reviews before contacting</li>
          <li>Ask about safety certifications and insurance</li>
          <li>Discuss pickup/drop-off locations and timing</li>
          <li>Confirm pricing and payment methods</li>
          <li>Request a trial ride if possible</li>
        </ul>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 500, margin: 20, maxHeight: '90vh', overflow: 'auto' }}>
            <h3>Send Transport Request</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
              Send a request to <strong>{selectedDriver?.displayName}</strong> for school transport service.
            </p>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Child's Name *
                </label>
                <input
                  type="text"
                  value={requestData.childName}
                  onChange={(e) => setRequestData({...requestData, childName: e.target.value})}
                  placeholder="Enter your child's name"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Child's Age
                </label>
                <input
                  type="number"
                  value={requestData.childAge}
                  onChange={(e) => setRequestData({...requestData, childAge: e.target.value})}
                  placeholder="Age"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Pickup Address *
                </label>
                <input
                  type="text"
                  value={requestData.pickupAddress}
                  onChange={(e) => setRequestData({...requestData, pickupAddress: e.target.value})}
                  placeholder="Home/pickup address"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  School/Drop-off Address *
                </label>
                <input
                  type="text"
                  value={requestData.dropoffAddress}
                  onChange={(e) => setRequestData({...requestData, dropoffAddress: e.target.value})}
                  placeholder="School or destination address"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Preferred Pickup Time
                </label>
                <input
                  type="time"
                  value={requestData.preferredTime}
                  onChange={(e) => setRequestData({...requestData, preferredTime: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Additional Notes
                </label>
                <textarea
                  value={requestData.additionalNotes}
                  onChange={(e) => setRequestData({...requestData, additionalNotes: e.target.value})}
                  placeholder="Any special requirements or additional information..."
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button 
                className="btn" 
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmitRequest}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
