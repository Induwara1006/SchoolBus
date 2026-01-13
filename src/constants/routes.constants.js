/**
 * Route Constants
 * Centralized route paths for the application
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PARENT_DASHBOARD: '/parent',
  DRIVER_DASHBOARD: '/driver',
  FIND_DRIVERS: '/find-drivers',
  DRIVER_PROFILE: '/driver-profile/:id',
};

export const getDriverProfileRoute = (driverId) => {
  return ROUTES.DRIVER_PROFILE.replace(':id', driverId);
};
