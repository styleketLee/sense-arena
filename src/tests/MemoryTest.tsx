import { useState, useEffect, useCallback } from 'react';
import { generateMemoryQuestion } from '../domain/testGenerators';
import { hapticSuccess, hapticError } from '../bridge/appInToss';
import type { MemoryQuestion } from '../domain/types';

interface MemoryTestProps {
  round: number;
  onCorrect: () => void;
  onWrong: () => void;
}

type Phase = 'showing' | 'input' | 'feedback';

export function MemoryTest({ round, onCorrect, onWrong }: MemoryTestProps) {
  const [question] = useState<MemoryQuestion>(() => generateMemoryQuestion(round));
  const [phase, setPhase] = useState<Phase>('showing');
  const [displayIndex, setDisplayIndex] = useState(0);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (phase !== 'showing') return;

    if (displayIndex < question.sequence.length) {
      const timer = setTimeout(() => {
        setDisplayIndex((prev) => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setPhase('input'), 300);
      return () => clearTimeout(timer);
    }
  }, [phase, displayIndex, question.sequence.length]);

  const handleNumberPress = useCallback((num: number) => {
    if (phase !== 'input') return;

    const newInput = [...userInput, num];
    setUserInput(newInput);

    if (newInput.length === question.sequence.length) {
      const correct = newInput.every((v, i) => v === question.sequence[i]);
      setIsCorrect(correct);
      setPhase('feedback');

      if (correct) {
        hapticSuccess();
        setTimeout(onCorrect, 600);
      } else {
        hapticError();
        setTimeout(onWrong, 600);
      }
    }
  }, [phase, userInput, question.sequence, onCorrect, onWrong]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      padding: '0 20px',
      width: '100%',
    }}>
      {phase === 'showing' && (
        <>
          <p style={{ fontSize: 16, color: '#4E5968' }}>숫자를 기억하세요</p>
          <div style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#3182F6',
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {displayIndex < question.sequence.length
              ? question.sequence[displayIndex]
              : ''}
          </div>
        </>
      )}

      {phase === 'input' && (
        <>
          <p style={{ fontSize: 16, color: '#4E5968' }}>순서대로 입력하세요</p>
          <div style={{
            display: 'flex',
            gap: 8,
            minHeight: 56,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {question.sequence.map((_, i) => (
              <div key={i} style={{
                width: 48, height: 56,
                borderRadius: 10,
                backgroundColor: i < userInput.length ? '#3182F6' : '#F4F4F4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: '#FFFFFF',
              }}>
                {i < userInput.length ? userInput[i] : ''}
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
            width: '100%',
            maxWidth: 360,
          }}>
            {Array.from({ length: 10 }, (_, i) => (
              <button
                key={i}
                onClick={() => handleNumberPress(i)}
                style={{
                  height: 64,
                  borderRadius: 14,
                  backgroundColor: '#F4F4F4',
                  fontSize: 26,
                  fontWeight: 600,
                  color: '#191F28',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'feedback' && (
        <div style={{
          fontSize: 36,
          fontWeight: 700,
          color: isCorrect ? '#34C759' : '#FF3B30',
          height: 100,
          display: 'flex',
          alignItems: 'center',
        }}>
          {isCorrect ? '정답!' : '오답...'}
        </div>
      )}
    </div>
  );
}
