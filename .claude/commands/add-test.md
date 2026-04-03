새로운 감각 테스트를 추가해 주세요.

$ARGUMENTS 에 테스트 이름과 설명이 포함됩니다. (예: "동체시력 테스트 - 움직이는 물체를 추적")

작업 순서:
1. CLAUDE.md 읽고 앱인토스 공식 문서 확인
2. domain/constants.ts에 TestConfig 추가
3. domain/types.ts에 필요한 Question 타입 추가
4. domain/testGenerators.ts에 문제 생성 함수 추가
5. domain/scoring.ts SCORING_PARAMS에 평균/표준편차 추가
6. src/tests/에 테스트 컴포넌트 생성
7. src/pages/TestPage.tsx renderTest()에 case 추가
8. domain/types.ts TestType에 추가
9. storage/schema.ts defaultRecords에 추가
10. 빌드 확인
