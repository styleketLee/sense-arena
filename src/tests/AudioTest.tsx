import { useState, useCallback, useRef, useEffect } from 'react';
import { generateAudioQuestion } from '../domain/testGenerators';
import { hapticSuccess, hapticError } from '../bridge/appInToss';
import type { AudioQuestion } from '../domain/types';

interface AudioTestProps {
  round: number;
  onCorrect: () => void;
  onWrong: () => void;
}

type Phase = 'playing-base' | 'pause' | 'playing-target' | 'answer';

const w = window as unknown as Record<string, unknown>;
const AudioContextClass = typeof AudioContext !== 'undefined'
  ? AudioContext
  : typeof w.webkitAudioContext !== 'undefined'
    ? w.webkitAudioContext as typeof AudioContext
    : null;

export function AudioTest({ round, onCorrect, onWrong }: AudioTestProps) {
  const [question] = useState<AudioQuestion>(() => generateAudioQuestion(round));
  const [phase, setPhase] = useState<Phase>('playing-base');
  const [answered, setAnswered] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(!AudioContextClass);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cancelledRef = useRef(false);

  const getAudioContext = useCallback(async (): Promise<AudioContext | null> => {
    if (cancelledRef.current || !AudioContextClass) return null;

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      try {
        audioCtxRef.current = new AudioContextClass();
      } catch {
        setAudioUnavailable(true);
        return null;
      }
    }

    // iOS/Safari에서 suspended 상태 처리
    if (audioCtxRef.current.state === 'suspended') {
      try {
        await audioCtxRef.current.resume();
      } catch {
        setAudioUnavailable(true);
        return null;
      }
    }

    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(async (frequency: number, duration: number): Promise<void> => {
    const ctx = await getAudioContext();
    if (!ctx || cancelledRef.current) return;

    return new Promise((resolve) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);

      const safetyTimeout = setTimeout(() => {
        osc.disconnect();
        gain.disconnect();
        resolve();
      }, duration * 1000 + 200);

      osc.onended = () => {
        clearTimeout(safetyTimeout);
        osc.disconnect();
        gain.disconnect();
        resolve();
      };
    });
  }, [getAudioContext]);

  useEffect(() => {
    cancelledRef.current = false;

    async function playSequence() {
      try {
        setPhase('playing-base');
        await playTone(question.baseFrequency, 0.6);
        if (cancelledRef.current) return;

        setPhase('pause');
        await new Promise((r) => setTimeout(r, 500));
        if (cancelledRef.current) return;

        setPhase('playing-target');
        await playTone(question.targetFrequency, 0.6);
        if (cancelledRef.current) return;

        setPhase('answer');
      } catch {
        if (!cancelledRef.current) setPhase('answer');
      }
    }

    playSequence();

    return () => {
      cancelledRef.current = true;
    };
  }, [question, playTone]);

  // AudioContext는 컴포넌트 unmount 시 항상 정리
  useEffect(() => {
    return () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      try {
        // 연결된 모든 노드 정리 후 컨텍스트 종료
        ctx.destination.disconnect?.();
        ctx.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    };
  }, []);

  const handleAnswer = (answer: 'higher' | 'lower') => {
    if (answered || phase !== 'answer') return;
    setAnswered(true);

    const isHigher = question.targetFrequency > question.baseFrequency;
    const correct = (answer === 'higher') === isHigher;

    if (correct) {
      hapticSuccess();
      onCorrect();
    } else {
      hapticError();
      onWrong();
    }
  };

  if (audioUnavailable) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 16, padding: '0 20px',
      }}>
        <div style={{ fontSize: 48 }}>🔇</div>
        <p style={{ fontSize: 16, color: '#4E5968', textAlign: 'center' }}>
          이 기기에서는 청각 테스트를 사용할 수 없어요
        </p>
        <button
          onClick={onWrong}
          style={{
            padding: '12px 24px', borderRadius: 12,
            backgroundColor: '#F4F4F4', fontSize: 15,
            fontWeight: 600, color: '#4E5968',
          }}
        >
          건너뛰기
        </button>
      </div>
    );
  }

  const phaseText = {
    'playing-base': '첫 번째 소리를 들어보세요',
    pause: '...',
    'playing-target': '두 번째 소리를 들어보세요',
    answer: '두 번째 소리가 더 높았나요, 낮았나요?',
  }[phase];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 32,
      padding: '0 20px',
    }}>
      <div style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        backgroundColor: phase === 'answer' ? '#2ECC71' : '#F4F4F4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 48,
        transition: 'all 0.3s',
      }}>
        {phase.startsWith('playing') ? '🔊' : phase === 'answer' ? '❓' : '⏸'}
      </div>

      <p style={{ fontSize: 16, color: '#4E5968', textAlign: 'center' }}>
        {phaseText}
      </p>

      {phase === 'answer' && !answered && (
        <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 320 }}>
          <button
            onClick={() => handleAnswer('higher')}
            style={{
              flex: 1, height: 56, borderRadius: 12,
              backgroundColor: '#3498DB', color: '#FFF',
              fontSize: 18, fontWeight: 600,
            }}
          >
            더 높았어요
          </button>
          <button
            onClick={() => handleAnswer('lower')}
            style={{
              flex: 1, height: 56, borderRadius: 12,
              backgroundColor: '#E74C3C', color: '#FFF',
              fontSize: 18, fontWeight: 600,
            }}
          >
            더 낮았어요
          </button>
        </div>
      )}
    </div>
  );
}
