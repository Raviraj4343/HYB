import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PREVIOUS_ROUTE_KEY = 'app.previousRoute';
const CURRENT_ROUTE_KEY = 'app.currentRoute';

const getRouteValue = (location) => `${location.pathname}${location.search}${location.hash}`;

const RouteHistoryTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const nextRoute = getRouteValue(location);
    const currentRoute = sessionStorage.getItem(CURRENT_ROUTE_KEY);

    if (currentRoute && currentRoute !== nextRoute) {
      sessionStorage.setItem(PREVIOUS_ROUTE_KEY, currentRoute);
    }

    sessionStorage.setItem(CURRENT_ROUTE_KEY, nextRoute);
  }, [location]);

  return null;
};

export default RouteHistoryTracker;
