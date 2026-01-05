
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { analyticsService } from '../services/analytics';

export const RouteHandler: React.FC = () => {
  const { pathname } = useLocation();
  const { user } = useStore();

  useEffect(() => {
    // 1. Scroll to top
    window.scrollTo(0, 0);

    // 2. Track Page View
    analyticsService.trackPageView(pathname, user?.id);

  }, [pathname, user?.id]);

  return null;
};
