/**
 * Status Constants
 * Centralized status configurations for student tracking
 */

export const STUDENT_STATUS = {
  AT_HOME: 'at-home',
  WAITING_PICKUP: 'waiting-pickup',
  PICKED_UP: 'picked-up',
  IN_TRANSIT: 'in-transit',
  AT_SCHOOL: 'at-school',
  RETURNING: 'returning',
  DROPPED_OFF: 'dropped-off',
};

export const STATUS_CONFIG = {
  [STUDENT_STATUS.AT_HOME]: { 
    label: 'At Home', 
    color: '#6b7280', 
    icon: '🏠' 
  },
  [STUDENT_STATUS.WAITING_PICKUP]: { 
    label: 'Waiting for Pickup', 
    color: '#f59e0b', 
    icon: '⏰' 
  },
  [STUDENT_STATUS.PICKED_UP]: { 
    label: 'Picked Up', 
    color: '#3b82f6', 
    icon: '🚌' 
  },
  [STUDENT_STATUS.IN_TRANSIT]: { 
    label: 'In Transit', 
    color: '#8b5cf6', 
    icon: '🚛' 
  },
  [STUDENT_STATUS.AT_SCHOOL]: { 
    label: 'At School', 
    color: '#10b981', 
    icon: '🏫' 
  },
  [STUDENT_STATUS.RETURNING]: { 
    label: 'Returning Home', 
    color: '#f97316', 
    icon: '🔄' 
  },
  [STUDENT_STATUS.DROPPED_OFF]: { 
    label: 'Dropped Off', 
    color: '#059669', 
    icon: '✅' 
  },
};

export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || { 
    label: 'Unknown', 
    color: '#9ca3af', 
    icon: '❓' 
  };
};
