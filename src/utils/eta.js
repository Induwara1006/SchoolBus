/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate ETA based on distance and average speed
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} avgSpeedKmh - Average speed in km/h (default: 30 km/h for city traffic)
 * @param {number} trafficFactor - Traffic multiplier (1.0 = normal, 1.5 = heavy traffic)
 * @returns {object} ETA information with minutes and formatted string
 */
export function calculateETA(distanceKm, avgSpeedKmh = 30, trafficFactor = 1.0) {
  const adjustedSpeed = avgSpeedKmh / trafficFactor;
  const timeHours = distanceKm / adjustedSpeed;
  const timeMinutes = Math.ceil(timeHours * 60);
  
  // Calculate arrival time
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + timeMinutes * 60000);
  
  return {
    minutes: timeMinutes,
    hours: Math.floor(timeMinutes / 60),
    distance: distanceKm.toFixed(1),
    arrivalTime: arrivalTime,
    formatted: formatETA(timeMinutes),
    arrivalTimeFormatted: arrivalTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
}

/**
 * Format ETA minutes into human-readable string
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string
 */
export function formatETA(minutes) {
  if (minutes < 1) return 'Arriving now';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

/**
 * Get traffic factor based on time of day
 * @returns {number} Traffic multiplier (1.0 - 2.0)
 */
export function getTrafficFactor() {
  const hour = new Date().getHours();
  
  // Rush hour traffic (7-9 AM, 4-7 PM)
  if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) {
    return 1.6; // Heavy traffic
  }
  
  // Midday traffic (11 AM - 2 PM)
  if (hour >= 11 && hour <= 14) {
    return 1.3; // Moderate traffic
  }
  
  // Night/early morning (10 PM - 6 AM)
  if (hour >= 22 || hour <= 6) {
    return 0.9; // Light traffic
  }
  
  return 1.0; // Normal traffic
}

/**
 * Calculate comprehensive ETA with bus location and destination
 * @param {object} busLocation - {lat, lng} of bus
 * @param {object} destination - {lat, lng} of destination
 * @param {number} avgSpeed - Average speed in km/h
 * @returns {object} Complete ETA information
 */
export function calculateBusETA(busLocation, destination, avgSpeed = 30) {
  if (!busLocation || !destination) {
    return {
      error: 'Location data not available',
      minutes: null,
      distance: null,
      formatted: 'ETA unavailable'
    };
  }

  const distance = calculateDistance(
    busLocation.lat,
    busLocation.lng,
    destination.lat,
    destination.lng
  );

  const trafficFactor = getTrafficFactor();
  const eta = calculateETA(distance, avgSpeed, trafficFactor);

  return {
    ...eta,
    trafficFactor,
    trafficCondition: getTrafficCondition(trafficFactor)
  };
}

/**
 * Get traffic condition description
 * @param {number} factor - Traffic factor
 * @returns {string} Traffic condition
 */
function getTrafficCondition(factor) {
  if (factor >= 1.5) return 'Heavy traffic 🔴';
  if (factor >= 1.2) return 'Moderate traffic 🟡';
  return 'Light traffic 🟢';
}

/**
 * Calculate ETA for multiple stops
 * @param {object} busLocation - Current bus location
 * @param {array} stops - Array of stop locations
 * @param {number} avgSpeed - Average speed
 * @param {number} stopDuration - Time spent at each stop in minutes
 * @returns {array} ETA for each stop
 */
export function calculateMultiStopETA(busLocation, stops, avgSpeed = 30, stopDuration = 2) {
  if (!busLocation || !stops || stops.length === 0) return [];

  let currentLocation = busLocation;
  let cumulativeTime = 0;
  const trafficFactor = getTrafficFactor();
  
  return stops.map((stop, index) => {
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      stop.lat,
      stop.lng
    );

    const eta = calculateETA(distance, avgSpeed, trafficFactor);
    cumulativeTime += eta.minutes + (index > 0 ? stopDuration : 0);
    
    const arrivalTime = new Date(Date.now() + cumulativeTime * 60000);
    
    currentLocation = stop;

    return {
      stopId: stop.id,
      stopName: stop.name,
      distance: distance.toFixed(1),
      eta: formatETA(cumulativeTime),
      etaMinutes: cumulativeTime,
      arrivalTime: arrivalTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  });
}

export default {
  calculateDistance,
  calculateETA,
  formatETA,
  getTrafficFactor,
  calculateBusETA,
  calculateMultiStopETA
};
