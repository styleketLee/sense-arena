import { useEffect } from 'react';
import { TEST_CONFIGS } from '../domain/constants';
import { useRecordStore } from '../stores/recordStore';
import { BannerAd } from '../components/AdWrapper';
import type { NavigateFn } from '../router';
import type { TestType } from '../domain/types';

interface HomePageProps {
  navigate: NavigateFn;
}

export function HomePage({ navigate }: HomePageProps) {
  const { records, isLoaded, loadRecords } = useRecordStore();

  useEffect(() => {
    if (!isLoaded) loadRecords().catch(() => {});
  }, [isLoaded, loadRecords]);

  const testTypes: TestType[] = ['color', 'reaction', 'memory', 'audio'];

  return (
    <div className="safe-area" style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#FFFFFF',
        padding: '16px 20px 12px',
        borderBottom: '1px solid #F4F4F4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#191F28' }}>
            감각측정소
          </h1>
          <p style={{ fontSize: 13, color: '#8B95A1', marginTop: 2 }}>
            나의 감각 능력을 테스트해 보세요
          </p>
        </div>
        <button
          onClick={() => navigate({ page: 'record' })}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            backgroundColor: '#F4F4F4',
            fontSize: 13,
            fontWeight: 600,
            color: '#4E5968',
            flexShrink: 0,
          }}
        >
          내 기록
        </button>
      </div>

      {/* Test Cards */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
        {testTypes.map((type) => {
          const config = TEST_CONFIGS[type];
          const record = records[type];

          return (
            <button
              key={type}
              onClick={() => navigate({ page: 'test', testType: type })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 20,
                borderRadius: 16,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E8E8E8',
                width: '100%',
                textAlign: 'left',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                backgroundColor: `${config.themeColor}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, flexShrink: 0,
              }}>
                {config.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#191F28' }}>
                  {config.name}
                </div>
                <div style={{ fontSize: 13, color: '#8B95A1', marginTop: 2 }}>
                  {config.description}
                </div>
                {record.bestScore > 0 && (
                  <div style={{
                    fontSize: 12, color: config.themeColor,
                    fontWeight: 600, marginTop: 6,
                  }}>
                    최고 기록: 상위 {100 - record.bestPercentile}%
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 12, color: '#8B95A1',
                flexShrink: 0,
              }}>
                {config.duration}초
              </div>
            </button>
          );
        })}
      </div>

      {/* Banner Ad */}
      <div style={{ padding: '0 20px 20px' }}>
        <BannerAd />
      </div>
    </div>
  );
}
