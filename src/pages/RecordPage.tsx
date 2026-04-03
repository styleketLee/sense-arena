import { useEffect } from 'react';
import { TEST_CONFIGS } from '../domain/constants';
import { useRecordStore } from '../stores/recordStore';
import { getGrade } from '../domain/scoring';
import { BannerAd } from '../components/AdWrapper';
import type { NavigateFn } from '../router';
import type { TestType } from '../domain/types';

interface RecordPageProps {
  navigate: NavigateFn;
}

export function RecordPage({ navigate }: RecordPageProps) {
  const { records, isLoaded, loadRecords } = useRecordStore();

  useEffect(() => {
    if (!isLoaded) loadRecords();
  }, [isLoaded, loadRecords]);

  const testTypes: TestType[] = ['color', 'reaction', 'memory', 'audio'];

  return (
    <div className="safe-area" style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #F4F4F4',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate({ page: 'home' })}
          style={{ fontSize: 16, color: '#4E5968' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>
          내 기록
        </h1>
      </div>

      {/* Records (scrollable) */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
        {testTypes.map((type) => {
          const config = TEST_CONFIGS[type];
          const record = records[type];
          const grade = record.bestPercentile > 0 ? getGrade(record.bestPercentile) : null;

          return (
            <div key={type} style={{
              padding: 20, borderRadius: 16,
              border: '1px solid #E8E8E8',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{config.icon}</span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{config.name}</span>
              </div>

              {record.bestScore > 0 ? (
                <>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 14, color: '#8B95A1' }}>최고 기록</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: config.themeColor }}>
                      상위 {100 - record.bestPercentile}%
                    </span>
                  </div>
                  {grade && (
                    <div style={{ fontSize: 14, color: '#4E5968' }}>
                      {grade.emoji} {grade.label}
                    </div>
                  )}
                  <div style={{
                    fontSize: 12, color: '#8B95A1', marginTop: 8,
                  }}>
                    총 {record.history.length}회 도전
                  </div>

                  {record.history.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: '1px solid #F4F4F4', paddingTop: 12 }}>
                      <div style={{ fontSize: 12, color: '#8B95A1', marginBottom: 8 }}>
                        최근 기록
                      </div>
                      {record.history.slice(0, 5).map((result, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '6px 0', fontSize: 13,
                        }}>
                          <span style={{ color: '#4E5968' }}>
                            {new Date(result.timestamp).toLocaleDateString('ko-KR')}
                          </span>
                          <span style={{ fontWeight: 600, color: '#191F28' }}>
                            상위 {100 - result.percentile}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 14, color: '#8B95A1' }}>
                  아직 기록이 없어요. 도전해 보세요!
                </p>
              )}

              <button
                onClick={() => navigate({ page: 'test', testType: type })}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10,
                  backgroundColor: `${config.themeColor}15`,
                  color: config.themeColor,
                  fontSize: 15, fontWeight: 600, marginTop: 12,
                }}
              >
                도전하기
              </button>
            </div>
          );
        })}

      </div>

      {/* Banner Ad - 하단 고정 */}
      <div style={{ flexShrink: 0, padding: '0 20px' }}>
        <BannerAd />
      </div>
    </div>
  );
}
