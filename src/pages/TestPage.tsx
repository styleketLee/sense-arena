import { useEffect, useRef, useCallback } from 'react';
import { useTestStore } from '../stores/testStore';
import { useRecordStore } from '../stores/recordStore';
import { TEST_CONFIGS, AD_GROUP_IDS } from '../domain/constants';
import { getPercentile } from '../domain/scoring';
import { ProgressBar } from '../components/ProgressBar';
import { ColorTest } from '../tests/ColorTest';
import { ReactionTest } from '../tests/ReactionTest';
import { MemoryTest } from '../tests/MemoryTest';
import { AudioTest } from '../tests/AudioTest';
import { loadInterstitialAd } from '../bridge/appInToss';
import type { TestType } from '../domain/types';
import type { NavigateFn } from '../router';

interface TestPageProps {
  testType: TestType;
  navigate: NavigateFn;
}

export function TestPage({ testType, navigate }: TestPageProps) {
  const config = TEST_CONFIGS[testType];
  const {
    isRunning, currentRound, score, timeLeft,
    startTest, nextRound, addScore, setTimeLeft, endTest, reset,
  } = useTestStore();
  const addResult = useRecordStore((s) => s.addResult);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const reactionTimesRef = useRef<number[]>([]);
  const finishedRef = useRef(false);
  const adPreloadCleanupRef = useRef<(() => void) | null>(null);

  // ref로 최신 값 추적 (stale closure 방지)
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const currentRoundRef = useRef(currentRound);
  currentRoundRef.current = currentRound;

  // finishTest를 ref로 안정화 — 의존성 변경 시에도 항상 최신 함수 참조
  const finishTestRef = useRef<() => void>(() => {});
  const finishTest = useCallback(() => finishTestRef.current(), []);

  finishTestRef.current = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    endTest();
    if (timerRef.current) clearInterval(timerRef.current);

    const currentScore = scoreRef.current;
    let finalScore = currentScore;
    if (testType === 'reaction' && reactionTimesRef.current.length > 0) {
      const avg = reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length;
      finalScore = Math.round(avg);
    }

    const percentile = getPercentile(finalScore, testType);

    addResult({
      testType,
      score: finalScore,
      percentile,
      timestamp: Date.now(),
      details: testType === 'reaction'
        ? { times: [...reactionTimesRef.current] }
        : { rounds: currentRoundRef.current, correctAnswers: currentScore },
    });

    navigate({ page: 'result', testType });
  };

  useEffect(() => {
    finishedRef.current = false;
    reset();
    startTest(testType, config.duration);
    reactionTimesRef.current = [];

    adPreloadCleanupRef.current = loadInterstitialAd(
      AD_GROUP_IDS.interstitial,
      () => {},
    );

    return () => {
      reset();
      if (timerRef.current) clearInterval(timerRef.current);
      adPreloadCleanupRef.current?.();
    };
  }, [testType, config.duration, reset, startTest]);

  // 타이머 - 1초마다 감소
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      const current = useTestStore.getState().timeLeft;
      if (current > 0) setTimeLeft(current - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, setTimeLeft]);

  // 시간 종료 감지
  useEffect(() => {
    if (isRunning && timeLeft <= 0 && !finishedRef.current) {
      finishTest();
    }
  }, [isRunning, timeLeft, finishTest]);

  const handleCorrect = useCallback(() => {
    addScore(1);
    if (currentRoundRef.current >= config.rounds) {
      finishTest();
    } else {
      nextRound();
    }
  }, [addScore, config.rounds, finishTest, nextRound]);

  const handleColorPenalty = useCallback(() => {
    addScore(-1);
  }, [addScore]);

  const handleWrong = useCallback(() => {
    if (currentRoundRef.current >= config.rounds) {
      finishTest();
    } else {
      nextRound();
    }
  }, [config.rounds, finishTest, nextRound]);

  const handleReactionResult = useCallback((ms: number) => {
    reactionTimesRef.current.push(ms);
    addScore(ms);
    if (currentRoundRef.current >= config.rounds) {
      finishTest();
    } else {
      nextRound();
    }
  }, [addScore, config.rounds, finishTest, nextRound]);

  if (!isRunning && timeLeft > 0) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 40 }}>{config.icon}</div>
        <p style={{ fontSize: 16, color: '#4E5968' }}>준비 중...</p>
      </div>
    );
  }

  return (
    <div className="safe-area" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigate({ page: 'home' })}
            style={{ fontSize: 16, color: '#4E5968', padding: '4px 0' }}
          >
            ← 그만하기
          </button>
          <div style={{
            fontSize: 20, fontWeight: 700,
            color: timeLeft <= 5 ? '#FF3B30' : '#191F28',
          }}>
            {timeLeft}초
          </div>
          <div style={{ fontSize: 14, color: '#8B95A1' }}>
            {currentRound}/{config.rounds}
          </div>
        </div>
        <ProgressBar
          current={currentRound}
          total={config.rounds}
          color={config.themeColor}
        />
      </div>

      {/* Test Area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 0',
      }}>
        {isRunning && renderTest()}
      </div>
    </div>
  );

  function renderTest() {
    switch (testType) {
      case 'color':
        return <ColorTest key={currentRound} round={currentRound} onCorrect={handleCorrect} onPenalty={handleColorPenalty} />;
      case 'reaction':
        return <ReactionTest key={currentRound} round={currentRound} onResult={handleReactionResult} />;
      case 'memory':
        return <MemoryTest key={currentRound} round={currentRound} onCorrect={handleCorrect} onWrong={handleWrong} />;
      case 'audio':
        return <AudioTest key={currentRound} round={currentRound} onCorrect={handleCorrect} onWrong={handleWrong} />;
    }
  }
}
