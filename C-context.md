# C-context — Part C 작성 배경 및 PoC 방향 정리

## PoC 방향 (미확정 — 작성 예정)

Part B에서 선택한 방향: **다 · 플라이휠 (쿼리 기반 데이터 분석 루프)**

과제 요구사항의 예시:
> 다 — 쿼리 수집 → 구조화 적재 → 퍼널 병합 분석까지 이어지는 end-to-end 미니 파이프라인

## PoC 후보 조각들

B.md의 Day별 계획에서 가장 중요한 조각 하나를 골라야 함.

### 후보 1 — `content_performance_map` 백필 + 분석 루프

- `content_ideas → carousel_generations → scheduled_posts → post_analytics` 4-hop 연결
- Drizzle 마이그레이션 + 백필 스크립트 + 루프 1 쿼리 실행
- 검증: 연결된 레코드 수 before/after, 루프 쿼리 결과 출력

### 후보 2 — `agent_queries` 적재 + 인텐트 분류 파이프라인

- 자연어 입력 → intent_type 분류 → `agent_queries` 적재 → `content_performance_map` 조인
- 검증: 쿼리 적재 확인, 인텐트 분류 정확도, 성과 데이터와 조인 결과

### 후보 3 — PostHog 병합 파이프라인

- PostHog 이벤트 + Drizzle DB를 `workspace_id`로 조인하는 배치 스크립트
- `page_viewed(planning)` 이벤트 → 최종 발행 여부 연결
- 검증: 퍼널 분석 (기획 페이지 방문 → 발행 도달률 before/after)

## 제출물 체크리스트

- [ ] 작동하는 코드
- [ ] 실행 및 검증 방법
- [ ] 검증 증거 (테스트·계측 결과·before/after 비교)
- [ ] AI 사용 회고 — 어디에 썼고, 어디서 믿지 않고 직접 검증했는지

## AI 사용 회고 메모 (작성 중 추가 예정)

- 스키마 설계: AI 초안 → 실제 코드베이스와 대조 후 수정
- 분석 루프 쿼리: AI 생성 → 실행 계획(EXPLAIN) 직접 확인
- 백필 스크립트: AI 초안 → 데이터 정합성 수동 검증 필수

## 참고: B-context 핵심 요약 (C 작성 시 참조)

- 다를 선택한 이유: Agent-first의 연료, 범위 명확, PO 판단력 드러냄
- 1주 후 목표: `content_performance_map` 80% 백필 + 루프 1·2 API 연결 + 인사이트 1개
- 스택: Next.js 15 · Vercel serverless · Drizzle ORM · PostHog
