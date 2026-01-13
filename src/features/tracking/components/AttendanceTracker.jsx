import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';

export default function AttendanceTracker({ userRole, studentId = null, studentName = null }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0
  });

  const fetchAttendance = useCallback(async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
      daysAgo.setHours(0, 0, 0, 0);

      let q;
      if (userRole === 'parent' && studentId) {
        q = query(
          collection(db, 'attendance'),
          where('studentId', '==', studentId),
          orderBy('date', 'desc')
        );
      } else if (userRole === 'driver') {
        q = query(
          collection(db, 'attendance'),
          where('driverId', '==', auth.currentUser.uid),
          orderBy('date', 'desc')
        );
      }

      if (!q) {

        return;
      }

      const snapshot = await getDocs(q);

      const attendanceData = snapshot.docs.map(doc => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data
        };
      });

      // Filter by date range
      const filtered = attendanceData.filter(record => {
        const recordDate = record.date?.toDate?.() || new Date(record.date) || new Date(0);
        const recordMidnight = new Date(recordDate);
        recordMidnight.setHours(0, 0, 0, 0);
        const isInRange = recordMidnight >= daysAgo;

        return isInRange;
      });

      setAttendance(filtered);
      calculateStats(filtered);
    } catch (err) {
      // Silently handle error in production
      if (import.meta.env.DEV) console.error('Attendance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, studentId, userRole]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const calculateStats = (records) => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = records.length;
    
    setStats({
      present,
      absent,
      late,
      attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : 0
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      present: '#10b981',
      absent: '#ef4444',
      late: '#f59e0b',
      excused: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      present: '✅',
      absent: '❌',
      late: '⏰',
      excused: '📝'
    };
    return icons[status] || '❓';
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>
          📊 Attendance Tracker
          {studentName && (
            <span style={{ fontSize: '0.85em', color: 'var(--muted)', marginLeft: 12 }}>
              - {studentName}
            </span>
          )}
        </h3>
        
        <select 
          className="input" 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          style={{ width: 'auto', padding: '8px 12px' }}
        >
          <option value="7">Last 7 Days</option>
          <option value="14">Last 14 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 3 Months</option>
        </select>
      </div>

      {/* Attendance Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ 
          padding: 16, 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))', 
          borderRadius: 12,
          border: '2px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5em', marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#10b981' }}>{stats.present}</div>
          <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginTop: 4 }}>Present</div>
        </div>

        <div style={{ 
          padding: 16, 
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))', 
          borderRadius: 12,
          border: '2px solid rgba(245, 158, 11, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5em', marginBottom: 4 }}>⏰</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f59e0b' }}>{stats.late}</div>
          <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginTop: 4 }}>Late</div>
        </div>

        <div style={{ 
          padding: 16, 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.05))', 
          borderRadius: 12,
          border: '2px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5em', marginBottom: 4 }}>❌</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>{stats.absent}</div>
          <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginTop: 4 }}>Absent</div>
        </div>

        <div style={{ 
          padding: 16, 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.05))', 
          borderRadius: 12,
          border: '2px solid rgba(99, 102, 241, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5em', marginBottom: 4 }}>📈</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.attendanceRate}%</div>
          <div style={{ fontSize: '0.85em', color: 'var(--muted)', marginTop: 4 }}>Rate</div>
        </div>
      </div>

      {/* Attendance Records */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          Loading attendance records...
        </div>
      ) : attendance.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <div style={{ fontSize: '3em', marginBottom: 12 }}>📅</div>
          <p>No attendance records found for this period</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Date</th>
                {userRole === 'driver' && (
                  <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Student</th>
                )}
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Pickup Time</th>
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Dropoff Time</th>
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 8px', color: 'var(--muted)', fontWeight: 600 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: '0.9em' }}>
                    {formatDate(record.date)}
                  </td>
                  {userRole === 'driver' && (
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                      {record.studentName || 'N/A'}
                    </td>
                  )}
                  <td style={{ padding: '12px 8px', fontSize: '0.9em', color: 'var(--muted)' }}>
                    {formatTime(record.pickupTime)}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '0.9em', color: 'var(--muted)' }}>
                    {formatTime(record.dropoffTime)}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85em',
                      fontWeight: 600,
                      background: `${getStatusColor(record.status)}15`,
                      color: getStatusColor(record.status),
                      border: `1px solid ${getStatusColor(record.status)}`
                    }}>
                      {getStatusIcon(record.status)} {record.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '0.85em', color: 'var(--muted)' }}>
                    {record.notes || '-'}
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
