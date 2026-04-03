interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
}

export function ProgressBar({ current, total, color = '#3182F6' }: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div style={{
      width: '100%',
      height: 4,
      backgroundColor: '#E8E8E8',
      borderRadius: 2,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: 2,
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}
