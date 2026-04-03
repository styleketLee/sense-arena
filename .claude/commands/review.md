전체 소스코드를 배포 전 관점에서 리뷰해 주세요.

체크 항목:
1. TypeScript 에러, 미사용 import, dead code
2. 런타임 버그: race condition, null 참조, 메모리 누수
3. 앱인토스 API 사용이 공식 문서와 일치하는지 (tossDocs/ 참조)
4. 비게임 출시 체크리스트 준수 여부 (granite.config.ts type: partner)
5. 광고 플로우: 사전 로딩 → show 순서, 2회 테스트마다 1회 전면 광고
6. UX: 빈 화면, 에러 상태, 로딩 상태 누락
7. CSS: safe-area, overflow, 소형 폰 레이아웃

심각도(CRITICAL/HIGH/MEDIUM/LOW)별로 분류하고, file:line 참조를 포함해 주세요.
