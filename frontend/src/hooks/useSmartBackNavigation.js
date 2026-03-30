import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PREVIOUS_ROUTE_KEY = 'app.previousRoute';

export const useSmartBackNavigation = (fallbackPath = '/') => {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (typeof window !== 'undefined') {
      const previousRoute = sessionStorage.getItem(PREVIOUS_ROUTE_KEY);
      const currentRoute = `${location.pathname}${location.search}${location.hash}`;

      if (previousRoute && previousRoute !== currentRoute) {
        navigate(previousRoute);
        return;
      }
    }

    if (typeof window !== 'undefined' && typeof window.history?.state?.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath, { replace: true });
  }, [fallbackPath, location.hash, location.pathname, location.search, navigate]);
};

export default useSmartBackNavigation;
