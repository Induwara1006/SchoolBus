import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';

export default function TripHistory({ userRole }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, cancelled
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90 days

  useEffect(() => {
    fetchTripHistory();
  }, [filter, dateRange]);

  const fetchTripHistory = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      let q;
      if (userRole === 'parent') {
        q = query(
          collection(db, 'trips'),
          where('parentId', '==', auth.currentUser.uid),
          orderBy('completedAt', 'desc'),
          limit(50)
        );
      } else if (userRole === 'driver') {
        q = query(
          collection(db, 'trips'),
          where('driverId', '==', auth.currentUser.uid),
          orderBy('completedAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const tripData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply filter
      let filtered = tripData;
      if (filter !== 'all') {
        filtered = tripData.filter(trip => trip.status === filter);
      }

      // Filter by date range
      filtered = filtered.filter(trip => {
        const tripDate = trip.completedAt?.toDate() || new Date(0);
        return tripDate >= daysAgo;
      });

      setTrips(filtered);
    } catch (error) {
      console.error('Error fetching trip history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
    const end = endTime.toDate ? endTime.toDate() : new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const getTripStats = () => {
    const completed = trips.filter(t => t.status === 'completed').length;
    const cancelled = trips.filter(t => t.status === 'cancelled').length;
    const totalDistance = trips.reduce((sum, t) => sum + (t.distance || 0), 0);
    const avgDuration = trips.length > 0
      ? trips.reduce((sum, t) => {
          const duration = t.startTime && t.endTime
            ? (t.endTime.toDate() - t.startTime.toDate()) / 60000
            : 0;
          return sum + duration;
        }, 0) / trips.length
      : 0;

    return { completed, cancelled, totalDistance: totalDistance.toFixed(1), avgDuration: Math.floor(avgDuration) };
  };

  const stats = getTripStats();

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>📊 Trip History</h3>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select 
            className="input" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px' }}
          >
            <option value="all">All Trips</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select 
            className="input" 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px' }}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Trip Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ 
          padding: 16, 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))', 
          borderRadius: 10,
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#10b981' }}>{stats.completed}</div>
          <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginTop: 4 }}>✅ Completed</div>
        </div>

        <div style={{ 
          padding: 16, 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))', 
          borderRadius: 10,
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>{stats.cancelled}</div>
          <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginTop: 4 }}>❌ Cancelled</div>
        </div>

        {userRole === 'driver' && (
          <>
            <div style={{ 
              padding: 16, 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05))', 
              borderRadius: 10,
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalDistance} km</div>
              <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginTop: 4 }}>🛣️ Total Distance</div>
            </div>

            <div style={{ 
              padding: 16, 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))', 
              borderRadius: 10,
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f59e0b' }}>{stats.avgDuration} min</div>
              <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginTop: 4 }}>⏱️ Avg Duration</div>
            </div>
          </>
        )}
      </div>

      {/* Trip List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          Loading trip history...
        </div>
      ) : trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <div style={{ fontSize: '3em', marginBottom: 12 }}>📭</div>
          <p>No trips found for this period</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>
                  {userRole === 'parent' ? 'Child' : 'Student'}
                </th>
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Route</th>
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Duration</th>
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: '0.9em' }}>
                    {formatDate(trip.completedAt || trip.startTime)}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                    {trip.childName || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '0.9em', color: 'var(--muted)' }}>
                    {trip.pickupAddress ? `${trip.pickupAddress} → ${trip.dropoffAddress}` : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '0.9em' }}>
                    {calculateDuration(trip.startTime, trip.endTime)}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85em',
                      fontWeight: 600,
                      background: trip.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: trip.status === 'completed' ? '#10b981' : '#ef4444',
                      border: `1px solid ${trip.status === 'completed' ? '#10b981' : '#ef4444'}`
                    }}>
                      {trip.status === 'completed' ? '✅ Completed' : '❌ Cancelled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
