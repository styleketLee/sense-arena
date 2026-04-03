# 감각측정소 (Sense Arena)

앱인토스(Apps in Toss) WebView 환경에서 동작하는 감각 테스트 미니앱.

## 테스트 종류

| 테스트 | 설명 | 시간 |
|--------|------|------|
| 색감 테스트 | 미세한 색 차이 구분 | 60초 |
| 반응속도 테스트 | 화면 변화 감지 → 터치 | 30초 |
| 순간기억력 테스트 | 숫자 순서 기억 | 60초 |
| 청각 테스트 | 주파수 차이 구분 | 60초 |

## 기술 스택

- React 19 + TypeScript (strict)
- Vite + React SWC
- @apps-in-toss/web-framework
- Zustand (상태 관리)
- Canvas 2D (결과 카드 렌더링)

## 실행

```bash
npm install
npm run dev      # 개발 서버 (localhost:5173)
npm run build    # 프로덕션 빌드
npm run deploy   # 빌드 + 앱인토스 배포
```

## 프로젝트 구조

```
src/
├── domain/        # 순수 로직 (타입, 점수 계산, 문제 생성)
├── stores/        # Zustand 상태 관리
├── storage/       # 앱인토스 Storage API 래퍼
├── bridge/        # 앱인토스 API 래퍼 (햅틱, 광고, 공유)
├── pages/         # 화면 (홈, 테스트, 결과, 기록)
├── tests/         # 개별 테스트 컴포넌트
└── components/    # 공통 컴포넌트
```
