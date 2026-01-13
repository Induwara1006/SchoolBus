import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import './EmergencyButton.css';

export default function EmergencyButton({ driverInfo, childInfo }) {
  const [showModal, setShowModal] = useState(false);
  const [emergencyType, setEmergencyType] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const emergencyTypes = [
    { value: 'child-sick', label: '🤒 Child is Sick', color: '#ef4444' },
    { value: 'running-late', label: '⏰ Running Late', color: '#f59e0b' },
    { value: 'cannot-find-child', label: '🔍 Cannot Find Child', color: '#ef4444' },
    { value: 'accident', label: '🚨 Accident/Emergency', color: '#dc2626' },
    { value: 'bus-breakdown', label: '🔧 Bus Issue', color: '#f97316' },
    { value: 'other', label: '❓ Other Emergency', color: '#6b7280' }
  ];

  const handleEmergencyCall = async () => {
    if (!emergencyType) {
      alert('Please select an emergency type');
      return;
    }

    setSending(true);
    try {
      // Create emergency notification in Firestore
      await addDoc(collection(db, 'emergencies'), {
        type: emergencyType,
        message: message || 'No additional message',
        parentId: auth.currentUser?.uid,
        parentEmail: auth.currentUser?.email,
        driverId: driverInfo?.id,
        driverEmail: driverInfo?.email,
        childName: childInfo?.name,
        childId: childInfo?.id,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Create notification for driver
      if (driverInfo?.id) {
        await addDoc(collection(db, 'notifications'), {
          userId: driverInfo.id,
          type: 'emergency',
          title: '🚨 Emergency Alert',
          message: `Emergency from parent: ${emergencyTypes.find(t => t.value === emergencyType)?.label} - ${childInfo?.name || 'Student'}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // If driver has phone, open WhatsApp
      if (driverInfo?.phone) {
        const emergencyMessage = `🚨 EMERGENCY: ${emergencyTypes.find(t => t.value === emergencyType)?.label}\n\nChild: ${childInfo?.name || 'Student'}\nMessage: ${message || 'No additional message'}\n\nPlease respond ASAP!`;
        const whatsappUrl = `https://wa.me/${driverInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(emergencyMessage)}`;
        window.open(whatsappUrl, '_blank');
      }

      alert('Emergency alert sent successfully! The driver has been notified.');
      setShowModal(false);
      setEmergencyType('');
      setMessage('');
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      alert('Failed to send emergency alert. Please try calling directly.');
    } finally {
      setSending(false);
    }
  };

  const handleDirectCall = () => {
    if (driverInfo?.phone) {
      window.location.href = `tel:${driverInfo.phone}`;
    } else {
      alert('Driver phone number not available');
    }
  };

  return (
    <>
      <button 
        className="emergency-btn"
        onClick={() => setShowModal(true)}
        aria-label="Emergency Contact"
      >
        <span className="emergency-icon">🚨</span>
        <span className="emergency-text">Emergency</span>
      </button>

      {showModal && (
        <div className="emergency-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="emergency-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emergency-modal-header">
              <h3>🚨 Emergency Contact</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="emergency-modal-body">
              <div className="emergency-info">
                <p><strong>Driver:</strong> {driverInfo?.displayName || 'Not assigned'}</p>
                <p><strong>Child:</strong> {childInfo?.name || 'Not selected'}</p>
              </div>

              <div className="emergency-type-selection">
                <label>Select Emergency Type:</label>
                <div className="emergency-types">
                  {emergencyTypes.map(type => (
                    <button
                      key={type.value}
                      className={`emergency-type-btn ${emergencyType === type.value ? 'selected' : ''}`}
                      style={{ borderColor: emergencyType === type.value ? type.color : 'var(--border)' }}
                      onClick={() => setEmergencyType(type.value)}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="emergency-message-section">
                <label>Additional Message (Optional):</label>
                <textarea
                  className="emergency-message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide any additional details..."
                  rows="3"
                />
              </div>

              <div className="emergency-actions">
                <button
                  className="btn btn-emergency"
                  onClick={handleEmergencyCall}
                  disabled={!emergencyType || sending}
                  style={{ 
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    fontWeight: '600',
                    flex: 1
                  }}
                >
                  {sending ? '📤 Sending...' : '📨 Send Emergency Alert'}
                </button>

                {driverInfo?.phone && (
                  <button
                    className="btn btn-call"
                    onClick={handleDirectCall}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      fontWeight: '600'
                    }}
                  >
                    📞 Call Now
                  </button>
                )}
              </div>

              <p className="emergency-note">
                ⚠️ Use this feature only for genuine emergencies. The driver will be immediately notified.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
