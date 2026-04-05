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

const VALID_TEST_TYPES = new Set<string>(['color', 'reaction', 'memory', 'audio']);

function parseRoute(path: string): Route {
  const cleaned = path.replace(/^\/+|\/+$/g, '');

  if (cleaned === 'record') return { page: 'record' };

  const testMatch = cleaned.match(/^test\/(.+)$/);
  if (testMatch?.[1] && VALID_TEST_TYPES.has(testMatch[1])) {
    return { page: 'test', testType: testMatch[1] as TestType };
  }

  const resultMatch = cleaned.match(/^result\/(.+)$/);
  if (resultMatch?.[1] && VALID_TEST_TYPES.has(resultMatch[1])) {
    return { page: 'result', testType: resultMatch[1] as TestType };
  }

  return { page: 'home' };
}

function routeToPath(route: Route): string {
  switch (route.page) {
    case 'home': return '/home';
    case 'test': return `/test/${route.testType}`;
    case 'result': return `/result/${route.testType}`;
    case 'record': return '/record';
  }
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));

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

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    const path = routeToPath(next);
    window.history.pushState(null, '', path);
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
