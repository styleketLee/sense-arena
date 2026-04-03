import { useState, useEffect, useCallback } from 'react';
import { setDeviceOrientation } from '@apps-in-toss/web-framework';
import { TossAds } from '@apps-in-toss/web-framework';
import { HomePage } from './pages/HomePage';
import { TestPage } from './pages/TestPage';
import { ResultPage } from './pages/ResultPage';
import { RecordPage } from './pages/RecordPage';
import type { TestType } from './domain/types';

type Route =
  | { page: 'home' }
  | { page: 'test'; testType: TestType }
  | { page: 'result'; testType: TestType }
  | { page: 'record' };

function parseInitialRoute(): Route {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');

  if (path === 'record') return { page: 'record' };

  return { page: 'home' };
}

function routeToPath(route: Route): string {
  switch (route.page) {
    case 'home': return '/home';
    case 'test': return '/home';
    case 'result': return '/home';
    case 'record': return '/record';
  }
}

export function App() {
  const [route, setRoute] = useState<Route>(parseInitialRoute);

  useEffect(() => {
    setDeviceOrientation({ type: 'portrait' });

    if (TossAds.initialize.isSupported()) {
      TossAds.initialize({
        callbacks: {
          onInitialized: () => {},
          onInitializationFailed: () => {},
        },
      });
    }
  }, []);

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    window.history.replaceState(null, '', routeToPath(next));
  }, []);

  switch (route.page) {
    case 'home':
      return <HomePage navigate={navigate} />;
    case 'test':
      return <TestPage testType={route.testType} navigate={navigate} />;
    case 'result':
      return <ResultPage testType={route.testType} navigate={navigate} />;
    case 'record':
      return <RecordPage navigate={navigate} />;
  }
}

export type { Route };
export type NavigateFn = (route: Route) => void;
