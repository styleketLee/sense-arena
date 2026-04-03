import { useState, useRef, useCallback, useEffect } from 'react';
import { hapticTap } from '../bridge/appInToss';

interface ReactionTestProps {
  round: number;
  onResult: (reactionTimeMs: number) => void;
}

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'too-early';

export function ReactionTest({ round, onResult }: ReactionTestProps) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [reactionTime, setReactionTime] = useState(0);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tooEarlyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const phaseRef = useRef<Phase>('waiting');

  // phase를 ref로도 추적 (이벤트 핸들러에서 최신 값 접근)
  const updatePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (tooEarlyTimeoutRef.current) clearTimeout(tooEarlyTimeoutRef.current);
  }, []);

  const startRound = useCallback(() => {
    clearAllTimers();
    updatePhase('ready');
    const delay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      updatePhase('go');
      hapticTap();
    }, delay);
  }, [clearAllTimers, updatePhase]);

  useEffect(() => {
    const timer = setTimeout(startRound, 500);
    return () => {
      clearTimeout(timer);
      clearAllTimers();
    };
  }, [round, startRound, clearAllTimers]);

  const handleTap = () => {
    const currentPhase = phaseRef.current;

    if (currentPhase === 'ready') {
      clearAllTimers();
      updatePhase('too-early');
      tooEarlyTimeoutRef.current = setTimeout(startRound, 1000);
      return;
    }

    if (currentPhase === 'go') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(elapsed);
      updatePhase('result');
      setTimeout(() => onResult(elapsed), 800);
    }
  };

  const bgColor = {
    waiting: '#F4F4F4',
    ready: '#E74C3C',
    go: '#2ECC71',
    result: '#3498DB',
    'too-early': '#FF9500',
  }[phase];

  const message = {
    waiting: '준비해 주세요...',
    ready: '초록색이 되면 터치하세요!',
    go: '지금! 터치하세요!',
    result: `${reactionTime}ms`,
    'too-early': '너무 빨랐어요!',
  }[phase];

  return (
    <button
      onClick={handleTap}
      style={{
        width: '100%',
        height: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        borderRadius: 20,
        transition: 'background-color 0.2s',
        margin: '0 20px',
        maxWidth: 'calc(100% - 40px)',
      }}
    >
      <span style={{
        fontSize: phase === 'result' ? 48 : 20,
        fontWeight: 700,
        color: '#FFFFFF',
        textShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}>
        {message}
      </span>
      {phase === 'result' && (
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
          라운드 {round}
        </span>
      )}
    </button>
  );
}
