import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function DriverProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    busNumber: '',
    area: '',
    school: '',
    route: '',
    capacity: '',
    price: '',
    schedule: '',
    description: '',
    phone: '',
    hasFirstAid: false,
    hasInsurance: false,
    yearsExperience: '',
    isAvailable: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadProfile(user.uid);
      } else {
        navigate('/login?role=driver');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setProfile(prevProfile => ({
          ...prevProfile,
          ...userData,
          // Ensure boolean fields are properly set
          hasFirstAid: userData.hasFirstAid || false,
          hasInsurance: userData.hasInsurance || false,
          isAvailable: userData.isAvailable !== false // Default to true
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        ...profile,
        profileUpdated: serverTimestamp(),
        // Ensure numeric fields are numbers
        capacity: profile.capacity ? parseInt(profile.capacity) : '',
        price: profile.price ? parseFloat(profile.price) : '',
        yearsExperience: profile.yearsExperience ? parseInt(profile.yearsExperience) : ''
      });
      
      alert('Profile updated successfully! 🎉');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: 40 }}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ marginBottom: 24 }}>
        <h3>Driver Profile Setup</h3>
        <p className="muted">Complete your profile to help parents find and connect with you</p>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {/* Bus Information */}
        <div>
          <h4 style={{ marginBottom: 16 }}>🚌 Bus Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Bus Number *
              </label>
              <input
                type="text"
                value={profile.busNumber}
                onChange={(e) => handleInputChange('busNumber', e.target.value)}
                placeholder="e.g., Bus-101"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Capacity (Students)
              </label>
              <input
                type="number"
                value={profile.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                placeholder="e.g., 30"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Service Area */}
        <div>
          <h4 style={{ marginBottom: 16 }}>📍 Service Details</h4>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Service Area *
              </label>
              <input
                type="text"
                value={profile.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                placeholder="e.g., Downtown, Westside, North District"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                School/Schools Served
              </label>
              <input
                type="text"
                value={profile.school}
                onChange={(e) => handleInputChange('school', e.target.value)}
                placeholder="e.g., Lincoln Elementary, Washington High School"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Route Description
              </label>
              <textarea
                value={profile.route}
                onChange={(e) => handleInputChange('route', e.target.value)}
                placeholder="e.g., Main St → Oak Ave → School → Park Rd → Downtown"
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Pricing & Schedule */}
        <div>
          <h4 style={{ marginBottom: 16 }}>💰 Pricing & Schedule</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Monthly Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={profile.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="e.g., 150.00"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Schedule
              </label>
              <input
                type="text"
                value={profile.schedule}
                onChange={(e) => handleInputChange('schedule', e.target.value)}
                placeholder="e.g., Mon-Fri 7:30 AM & 3:30 PM"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Contact & Experience */}
        <div>
          <h4 style={{ marginBottom: 16 }}>📞 Contact & Experience</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="e.g., +1234567890"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Years of Experience
              </label>
              <input
                type="number"
                value={profile.yearsExperience}
                onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                placeholder="e.g., 5"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            About You & Your Service
          </label>
          <textarea
            value={profile.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Tell parents about your experience, safety measures, and what makes your service special..."
            rows={4}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        {/* Certifications */}
        <div>
          <h4 style={{ marginBottom: 16 }}>🏆 Certifications & Features</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={profile.hasFirstAid}
                onChange={(e) => handleInputChange('hasFirstAid', e.target.checked)}
              />
              <span>🩹 First Aid Certified</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={profile.hasInsurance}
                onChange={(e) => handleInputChange('hasInsurance', e.target.checked)}
              />
              <span>🛡️ Full Insurance Coverage</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={profile.isAvailable}
                onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
              />
              <span>✅ Currently Accepting New Students</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ paddingTop: 16, borderTop: '1px solid #eee' }}>
          <button
            className="btn btn-primary"
            onClick={handleSaveProfile}
            disabled={saving}
            style={{ padding: '12px 24px', fontSize: '1.1em' }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          
          <div style={{ marginTop: 12, fontSize: '0.9em', color: '#666' }}>
            💡 Complete your profile to appear in parent searches and receive more inquiries
          </div>
        </div>
      </div>
    </div>
  );
}