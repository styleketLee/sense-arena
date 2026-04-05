# CLAUDE.md

## 프로젝트 개요
앱인토스(Apps in Toss) WebView 환경에서 동작하는 감각 테스트 미니앱.

- 앱명: 감각측정소 (appName: `kamkak`)
- 장르: 감각 능력 측정 테스트 시리즈
- 목표: 백엔드 없이 동작하는 MVP 구현 (현재 MVP 구현 완료)
- 플랫폼: 토스 앱 내 WebView (iOS/Android)
- 수익: 전면 광고 + 배너 광고

---

## 항상 먼저 할 일
작업 시작 전에 반드시 다음 순서로 진행한다.

1. 이 CLAUDE.md를 먼저 읽는다.
2. 앱인토스 공식 문서를 fetch하여 최신 API를 확인한다. 기억에 의존하지 않는다.
3. 구현 계획을 10줄 이내로 제시한 뒤 작업한다.
4. 코드를 생성하기 전에 기존 파일 구조를 먼저 확인한다.

---

## 공식 문서 (반드시 참조)
| 용도 | URL |
|------|-----|
| 앱인토스 기본 | https://developers-apps-in-toss.toss.im/llms.txt |
| 앱인토스 전체 | https://developers-apps-in-toss.toss.im/llms-full.txt |
| 앱인토스 예제 | https://developers-apps-in-toss.toss.im/tutorials/examples.md |
| Storage 예제 코드 | https://developers-apps-in-toss.toss.im/examples/with-storage.txt |
| TDS 컴포넌트 | https://tossmini-docs.toss.im/tds-mobile/llms-full.txt |
| 비게임 출시 가이드 | https://developers-apps-in-toss.toss.im/checklist/app-nongame.html |

문서 참조 규칙:
- 앱인토스 API를 사용할 때는 반드시 공식 문서를 fetch해서 시그니처를 확인한다.
- 기억에 의존해서 API를 추측 사용하지 않는다.
- 문서에 없거나 불명확한 API는 `// TODO: 앱인토스 문서 확인 필요`로 표기한다.

---

## 앱인토스 프레임워크 구분 (중요)

이 프로젝트는 **Web 방식**을 사용한다.

| 구분 | Web (이 프로젝트) | React Native |
|------|-------------------|--------------|
| 프레임워크 | `@apps-in-toss/web-framework` | `@apps-in-toss/framework` + `@granite-js/react-native` |
| 빌드 | Vite | Granite CLI (`granite dev/build`) |
| UI 라이브러리 | HTML/CSS/Canvas | `@toss-design-system/react-native` |
| 설정 파일 | `granite.config.ts` (공통) | `granite.config.ts` (공통) |

React Native 쪽 패턴과 혼동하지 않는다.

---

## 기술 스택

- **React 19** + **TypeScript** (strict mode)
- **Vite** + React SWC 플러그인
- **@apps-in-toss/web-framework** — 앱인토스 Web API
- **Zustand** — 상태 관리
- **Canvas 2D** — 테스트 렌더링 (색감 테스트 등)
- **CSS** — 바닐라 CSS (CSS-in-JS 라이브러리 불필요)

추가하지 않는 것:
- CSS-in-JS 라이브러리
- 복잡한 애니메이션 라이브러리
- 차트 라이브러리 (Canvas로 직접 그리면 충분)

---

## 제품 목표

**짧은 테스트 → 결과 공유 → 바이럴** 구조의 감각 측정 앱.

핵심 루프:
```
홈 진입 → 테스트 선택 → 테스트 진행 (30초~2분)
→ 결과 산출 ("상위 N%") → 결과 카드 공유 → 다른 테스트 도전
```

### 테스트 시리즈 (MVP)
| 테스트 | 설명 | 시간 |
|--------|------|------|
| 색감 테스트 | 미세한 색 차이 구분 | 60초 |
| 반응속도 테스트 | 화면 변화 감지 → 터치 | 30초 |
| 순간기억력 테스트 | 숫자/패턴 순서 기억 | 60초 |
| 청각 테스트 | 주파수 차이 구분 (Web Audio API) | 60초 |

### 추후 확장
- 동체시력 테스트
- 리듬감 테스트
- 공간지각력 테스트
- 친구 대결 (URL 파라미터로 점수 공유)

---

## 광고 전략

| 지점 | 형태 | 조건 |
|------|------|------|
| 테스트 사이 | 전면 광고 | 3회 테스트마다 1회 (adCounter.ts) |
| 홈·기록 하단 | 배너 광고 | 상시 노출 |

광고 규칙 (앱인토스 비게임 출시 가이드 준수):
- 광고는 사전 로딩, 재생 시점에 실시간 로딩 금지
- 예상하기 어려운 순간에 광고 노출 금지
- 광고 종료 후 미니앱 화면으로 정상 복귀
- 배너는 스크롤 가능한 화면에만 노출
- 인트로/로딩/팝업 모달 등 일시적 화면에 배너 금지

---

## MVP 범위

### 구현 대상
| 카테고리 | 항목 |
|----------|------|
| 화면 | 홈, 테스트 진행, 결과, 기록 |
| 테스트 | 색감, 반응속도, 순간기억력, 청각 (4종) |
| 결과 | 점수, 상위 N% 환산, 결과 카드 (Canvas 렌더링) |
| 저장 | 최고 기록, 테스트별 히스토리 |
| 공유 | 결과 카드 이미지 공유 |
| 광고 | 전면, 배너 |

### MVP에서 제외
- 서버 기반 랭킹
- 친구 대결
- 인앱 결제

---

## 프로젝트 구조
```
├── granite.config.ts          # 앱인토스 설정 (defineConfig)
├── vite.config.ts             # Vite 빌드 설정
├── tsconfig.json              # TypeScript 설정
├── index.html                 # 진입점
├── src/
│   ├── main.tsx               # React 루트
│   ├── router.tsx             # SPA 라우팅 (history.replaceState)
│   ├── domain/                # 순수 로직 (외부 import 없는 순수 함수)
│   │   ├── types.ts           # 테스트 결과, 점수, 문제 타입
│   │   ├── constants.ts       # 테스트 설정값, 광고 ID, 스코어링 파라미터
│   │   ├── scoring.ts         # 점수 산출 & 정규분포 기반 상위% 환산
│   │   └── testGenerators.ts  # 문제 생성 알고리즘 (색상, 기억, 청각)
│   ├── stores/                # Zustand 상태 관리
│   │   ├── testStore.ts       # 진행 중 테스트 상태 (라운드, 점수, 타이머)
│   │   ├── recordStore.ts     # 최고 기록 & 히스토리 (Storage 연동)
│   │   └── adCounter.ts       # 전면 광고 빈도 카운터
│   ├── storage/               # 저장 레이어
│   │   ├── storageAdapter.ts  # 앱인토스 Storage → localStorage fallback
│   │   ├── schema.ts          # 저장 스키마 & 버전
│   │   └── migration.ts       # 스키마 마이그레이션
│   ├── pages/                 # 화면 컴포넌트
│   │   ├── HomePage.tsx       # 테스트 목록 & 내 기록 요약
│   │   ├── TestPage.tsx       # 테스트 진행 (타이머, 광고 연동)
│   │   ├── ResultPage.tsx     # 결과 & 공유 카드
│   │   └── RecordPage.tsx     # 전체 기록 히스토리
│   ├── tests/                 # 개별 테스트 컴포넌트
│   │   ├── ColorTest.tsx      # 색감 테스트 (Canvas 그리드)
│   │   ├── ReactionTest.tsx   # 반응속도 테스트 (phase 기반)
│   │   ├── MemoryTest.tsx     # 순간기억력 테스트 (숫자 시퀀스)
│   │   └── AudioTest.tsx      # 청각 테스트 (Web Audio API)
│   ├── components/            # 공통 컴포넌트
│   │   ├── ResultCard.tsx     # Canvas 결과 카드 렌더링
│   │   ├── ProgressBar.tsx    # 테스트 진행률 바
│   │   └── AdWrapper.tsx      # 배너 광고 래퍼
│   └── bridge/                # 앱인토스 API 래퍼
│       └── appInToss.ts       # 햅틱, 광고, 공유 API
├── public/
│   └── assets/
├── styles/
│   └── global.css             # CSS 변수, 기본 스타일
└── tossDocs/                  # 앱인토스 문서 로컬 캐시 (참고용)
```

레이어 의존 방향: `pages → stores → domain ← storage`, `pages → tests`
- domain은 어떤 레이어도 import하지 않는다 (순수 함수).
- tests 컴포넌트는 domain의 생성 알고리즘을 사용한다.

---

## "상위 N%" 환산 로직

서버 없이 상위 퍼센트를 보여주는 방법:
- 정규분포 기반 환산 테이블을 하드코딩한다.
- 각 테스트별 평균/표준편차를 사전 정의한다.
- 유저 점수를 z-score로 변환 → 백분위 환산.
- 실제 유저 데이터가 쌓이면 추후 서버 기반으로 교체한다.

```ts
// domain/scoring.ts 예시
function getPercentile(score: number, mean: number, stdDev: number): number {
  const zScore = (score - mean) / stdDev;
  return Math.round(normalCDF(zScore) * 100);
}
```

---

## 앱인토스 특화 원칙
- WebView MVP를 우선한다.
- 기기 방향은 `setDeviceOrientation({ type: 'portrait' })`로 고정한다.
- 진동 피드백: 정답 시 `generateHapticFeedback({ type: 'success' })`, 오답 시 `error`.
- 내비게이션 바: 비게임 내비게이션 바 사용 필수 (좌측 뒤로가기, 중앙 앱 이름).
- 안전 영역은 `env(safe-area-inset-*)` CSS 변수로 처리한다.
- 문서상 불명확한 부분은 `// TODO: 앱인토스 문서 확인 필요`로 표기한다.

---

## 앱인토스 Storage API

Storage 원칙:
- 앱인토스 Storage API를 기본으로 사용한다.
- localStorage를 기본 저장소로 가정하지 않는다.
- Storage가 unavailable일 때만 localStorage로 fallback한다.
- fallback 로직은 storage 래퍼 안에 캡슐화한다.
- 저장 스키마에 `version` 필드를 둔다.
- 실패 시 안전한 기본값으로 복구한다.

---

## 설정 파일 (granite.config.ts)

```ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'kamkak',
  brand: {
    displayName: '감각측정소',
    primaryColor: '#3182F6',
    icon: '...',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: { dev: 'vite', build: 'tsc -b && vite build' },
  },
  outdir: 'dist',
  webViewProps: { type: 'partner' },
});
```

## 빌드 & 배포

```bash
npm run dev          # 로컬 개발 서버 (Vite)
npm run build:web    # tsc + vite build
npm run build        # npx ait build (.ait 패키징)
npm run deploy       # npx ait build && npx ait deploy
```

---

## 최우선 원칙

### 1. 앱인토스 공식 문서 우선
- 공식 문서를 최우선으로 따른다.
- 문서와 충돌하는 추측 구현을 하지 않는다.

### 2. 백엔드 없는 MVP
- 초기 MVP는 백엔드 없이 완전히 동작해야 한다.
- 상위% 환산은 정규분포 테이블로 처리한다.

### 3. Storage 우선
- 앱인토스 Storage API를 기본으로 설계한다.

### 4. TDS 톤 & 문구
- UI는 토스 디자인 시스템(TDS) 감성을 최대한 반영한다.
- 문구: 한국어 해요체, 능동형, 긍정형. 1줄 이내.
- 예: "색감 능력을 테스트해 보세요", "상위 3%의 눈을 가졌어요!"
- 다이얼로그 왼쪽 버튼 문구는 "닫기"를 우선 사용한다.

### 5. 단순함
- 과도한 추상화를 피한다.
- 1인 개발 유지보수성을 항상 고려한다.

---

## UI / UX 원칙
- 홈 화면: 테스트 카드 리스트, 깔끔한 TDS 감성.
- 테스트 화면: 집중할 수 있게 미니멀. 타이머 + 문제만.
- 결과 화면: 점수 크게 + 상위% + 공유 버튼 강조.
- 결과 카드: Canvas로 렌더링, 캡처/공유하고 싶은 디자인.
- 색상: 토스 블루(`#3182F6`) 포인트, 테스트별 테마 색상.
- 문구 규칙:
  - 해요체 ("테스트해 보세요", "대단해요!")
  - 능동형 ("확인할 수 있어요" ✓)
  - 긍정형 ("상위 3%예요!" ✓)

---

## 비게임 출시 체크리스트 (앱인토스 가이드 기반)
- [x] 비게임 내비게이션 바 사용 (좌측 뒤로가기, 중앙 앱이름)
- [x] 제스처 확대·축소 비활성화
- [x] 라이트 모드 테마
- [x] 종료 후 재접속 시 데이터 유지 (Storage API)
- [x] 광고 사전 로딩 (TossAds.initialize)
- [x] 배너는 스크롤 가능한 화면에만 (홈, 기록)
- [x] 세로 모드 고정 (setDeviceOrientation)
- [x] 모든 화면에서 뒤로가기 작동 (pushState + popstate 처리)
- [ ] 상호작용 2초 이상 지연 없음 (검증 필요)

---

## 코드 출력 형식
항상 아래 순서로 답한다.
1. 구현 계획 (10줄 이내)
2. 생성/수정 파일 목록
3. 파일별 전체 코드
4. 실행 방법
5. 다음 단계

---

## 금지 사항
- 공식 문서 미확인 상태에서 앱인토스 API 단정 사용
- localStorage를 기본 저장소로 채택
- 첫 MVP부터 서버 전제 설계
- 과한 아키텍처 도입
- 설명만 하고 실제 코드 생성을 미루는 답변
- 테스트 설정값을 코드 곳곳에 하드코딩 (constants.ts에 모아둔다)
- 기존 동작하는 코드를 확인 없이 덮어쓰기
- React Native 패턴을 Web 프로젝트에 혼용
