import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const hasBrowserHistory = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return typeof window.history?.state?.idx === 'number' && window.history.state.idx > 0;
};

export const useSmartBackNavigation = (fallbackPath = '/') => {
  const navigate = useNavigate();

  return useCallback(() => {
    if (hasBrowserHistory()) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath, { replace: true });
  }, [fallbackPath, navigate]);
};

export default useSmartBackNavigation;
