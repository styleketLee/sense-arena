import { useState, useCallback, useRef } from 'react';
import { useRecordStore } from '../stores/recordStore';
import { AD_GROUP_IDS } from '../domain/constants';
import { getPercentileMessage } from '../domain/scoring';
import { ResultCard } from '../components/ResultCard';
import { showInterstitialAd, shareResultImage } from '../bridge/appInToss';
import { useAdCounter } from '../stores/adCounter';
import type { TestType } from '../domain/types';
import type { NavigateFn } from '../router';

interface ResultPageProps {
  testType: TestType;
  navigate: NavigateFn;
}

export function ResultPage({ testType, navigate }: ResultPageProps) {
  const record = useRecordStore((s) => s.records[testType]);
  const latestResult = record.history[0];
  const [showResult, setShowResult] = useState(false);
  const [sharing, setSharing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldShowAd = useAdCounter((s) => s.shouldShowAd);
  const incrementCounter = useAdCounter((s) => s.increment);

  const handleShowResult = useCallback(() => {
    incrementCounter();

    if (shouldShowAd()) {
      showInterstitialAd(
        AD_GROUP_IDS.interstitial,
        () => setShowResult(true),
      );
    } else {
      setShowResult(true);
    }
  }, [shouldShowAd, incrementCounter]);

  const handleShare = useCallback(async () => {
    if (!canvasRef.current || sharing) return;
    setSharing(true);
    await shareResultImage(canvasRef.current);
    setSharing(false);
  }, [sharing]);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  if (!latestResult) {
    navigate({ page: 'home' });
    return null;
  }

  if (!showResult) {
    return (
      <div className="safe-area" style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 20, gap: 24,
      }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }}>
          테스트 완료!
        </h2>
        <p style={{ fontSize: 15, color: '#4E5968', textAlign: 'center' }}>
          {shouldShowAd() ? '결과 확인 전 짧은 광고가 표시돼요' : '결과를 확인해 보세요'}
        </p>
        <button
          onClick={handleShowResult}
          style={{
            width: '100%', maxWidth: 320,
            padding: '16px 0', borderRadius: 12,
            backgroundColor: '#3182F6', color: '#FFFFFF',
            fontSize: 17, fontWeight: 700,
          }}
        >
          결과 확인하기
        </button>
        <button
          onClick={() => navigate({ page: 'home' })}
          style={{
            fontSize: 14, color: '#8B95A1', padding: '8px 0',
          }}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="safe-area" style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 20px',
      gap: 24,
    }}>
      <ResultCard
        testType={testType}
        score={latestResult.score}
        percentile={latestResult.percentile}
        onCanvasReady={handleCanvasReady}
      />

      <p style={{
        fontSize: 18, fontWeight: 600, color: '#191F28',
        textAlign: 'center',
      }}>
        {getPercentileMessage(latestResult.percentile)}
      </p>

      {/* Actions */}
      <div style={{
        width: '100%', maxWidth: 340,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <button
          onClick={handleShare}
          disabled={sharing}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 12,
            backgroundColor: '#191F28', color: '#FFFFFF',
            fontSize: 16, fontWeight: 700,
            opacity: sharing ? 0.6 : 1,
          }}
        >
          {sharing ? '공유 준비 중...' : '결과 공유하기'}
        </button>
        <button
          onClick={() => navigate({ page: 'test', testType })}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 12,
            backgroundColor: '#3182F6', color: '#FFFFFF',
            fontSize: 16, fontWeight: 700,
          }}
        >
          다시 도전하기
        </button>
        <button
          onClick={() => navigate({ page: 'home' })}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 12,
            backgroundColor: '#F4F4F4', color: '#4E5968',
            fontSize: 16, fontWeight: 600,
          }}
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
