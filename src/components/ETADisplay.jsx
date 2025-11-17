import { useState, useEffect } from 'react';
import { calculateBusETA, formatETA } from '../utils/eta';

export default function ETADisplay({ busLocation, childLocation, childName }) {
  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (busLocation && childLocation) {
      const calculatedEta = calculateBusETA(busLocation, childLocation);
      setEta(calculatedEta);
    }
  }, [busLocation, childLocation]);

  if (!eta) return null;

  return (
    <div style={{
      padding: '12px 16px',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05))',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: '10px',
      marginTop: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.9em', color: 'var(--muted)', marginBottom: 4 }}>
            ⏱️ Estimated Arrival
          </div>
          <div style={{ fontSize: '1.4em', fontWeight: 'bold', color: 'var(--primary)' }}>
            {eta.formatted}
          </div>
          <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginTop: 4 }}>
            Expected at {eta.arrivalTimeFormatted}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginBottom: 8 }}>
            📍 {eta.distance} km away
          </div>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.8em',
            fontWeight: 600,
            background: eta.trafficFactor >= 1.5 ? 'rgba(239, 68, 68, 0.1)' : 
                        eta.trafficFactor >= 1.2 ? 'rgba(245, 158, 11, 0.1)' : 
                        'rgba(16, 185, 129, 0.1)',
            color: eta.trafficFactor >= 1.5 ? '#ef4444' : 
                   eta.trafficFactor >= 1.2 ? '#f59e0b' : 
                   '#10b981'
          }}>
            {eta.trafficCondition}
          </div>
        </div>
      </div>
    </div>
  );
}
