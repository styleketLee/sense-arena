import { useState, useCallback } from 'react';
import { generateColorQuestion } from '../domain/testGenerators';
import { hapticSuccess, hapticError } from '../bridge/appInToss';
import type { ColorQuestion } from '../domain/types';

interface ColorTestProps {
  round: number;
  onCorrect: () => void;
  onPenalty?: () => void;
}

export function ColorTest({ round, onCorrect, onPenalty }: ColorTestProps) {
  const [question] = useState<ColorQuestion>(() => generateColorQuestion(round));
  const [answered, setAnswered] = useState(false);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);

  const gridSize = Math.ceil(Math.sqrt(question.colors.length));

  const handleTap = useCallback((index: number) => {
    if (answered) return;

    if (index === question.differentIndex) {
      setAnswered(true);
      hapticSuccess();
      onCorrect();
    } else {
      // 오답: 시각 피드백 + 패널티, 계속 도전 가능
      setWrongIndex(index);
      hapticError();
      onPenalty?.();
      setTimeout(() => setWrongIndex(null), 400);
    }
  }, [answered, question.differentIndex, onCorrect, onPenalty]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: '0 16px',
      width: '100%',
    }}>
      <p style={{
        fontSize: 16,
        color: '#4E5968',
        textAlign: 'center',
      }}>
        다른 색을 찾아주세요
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 3,
        width: '100%',
        maxWidth: 'min(400px, calc(100vw - 32px))',
        aspectRatio: '1',
      }}>
        {question.colors.map((color, i) => (
          <button
            key={i}
            onClick={() => handleTap(i)}
            style={{
              backgroundColor: color,
              border: answered && i === question.differentIndex
                ? '3px solid #3182F6'
                : wrongIndex === i
                  ? '3px solid #FF3B30'
                  : 'none',
              borderRadius: 6,
              cursor: answered ? 'default' : 'pointer',
              aspectRatio: '1',
              transition: 'transform 0.1s, opacity 0.15s',
              opacity: answered && i !== question.differentIndex ? 0.5 : 1,
              transform: wrongIndex === i ? 'scale(0.9)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
