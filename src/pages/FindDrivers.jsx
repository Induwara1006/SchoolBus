import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function FindDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchArea, setSearchArea] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState([]);

  useEffect(() => {
    fetchDrivers();
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
      console.error('Error fetching drivers:', error);
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
            
            <button 
              className="btn btn-primary"
              onClick={() => handleContactDriver(driver)}
              style={{ fontSize: '0.9em', padding: '8px 16px' }}
            >
              📞 Contact
            </button>
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
          <div style={{ marginBottom: 16, color: '#666' }}>
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
        <ul style={{ marginLeft: 16, color: '#666' }}>
          <li>Check driver ratings and reviews before contacting</li>
          <li>Ask about safety certifications and insurance</li>
          <li>Discuss pickup/drop-off locations and timing</li>
          <li>Confirm pricing and payment methods</li>
          <li>Request a trial ride if possible</li>
        </ul>
      </div>
    </div>
  );
}