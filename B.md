# Part B — 레버리지 선택과 첫 1주 계획

## 선택: 다 · 플라이휠 (쿼리 기반 데이터 분석 루프)

---

## 1. 왜 이 방향인가

### 나(Agent-first)가 아닌 이유

가장 큰 방향 전환은 나(Agent-first)입니다. "그냥 말하면 되는" 인터페이스, 성과 연동 요금제, 지표 번역 레이어 — 이 제안들이 Mirra의 장기 방향이라고 생각합니다.

그러나 지금 Agent를 먼저 만들면 맥락 없이 답하는 챗봇이 됩니다.

Agent가 "지난주 참여율이 높았던 형식으로 이번 주 콘텐츠를 제안해줘"에 답하려면, Mirra 안에 "지난주 어떤 콘텐츠가 어떤 성과를 냈는지"가 연결된 상태로 존재해야 합니다. 현재 스키마 분석에서 확인했듯, `content_ideas → carousel_generations → scheduled_posts → post_analytics`의 4-hop이 끊겨 있고, PostHog 행동 데이터와 Drizzle DB 비즈니스 데이터는 분리되어 있습니다. Agent-first 전환의 연료가 없는 상태입니다.

순서가 중요합니다. **데이터 파이프라인 없는 Agent는 UI만 바꾼 것**입니다. 다가 먼저여야 나가 작동합니다.

### 가(부채)가 아닌 이유

i18n 키 누락, 진입 게이트 UI, 다국어 스냅샷 테스트 — 이것들은 실제로 수정이 필요한 문제입니다. 그러나 방어적인 작업입니다. 1호 엔지니어의 첫 1주가 버그 수정으로 채워지면, Mirra가 지금 당장 필요한 "성장의 근거"를 만들지 못합니다.

가는 다가 만든 데이터 루프 위에서 우선순위를 판단하며 점진적으로 해결할 수 있습니다. 어떤 부채가 실제 사용자 이탈과 연결되는지를 데이터로 보기 전에 전면 리팩토링을 시작하는 것은 순서가 틀립니다.

### 다를 선택한 이유

지금 Mirra에 가장 레버리지가 큰 한 수는 **기획 → 생성 → 발행 → 성과의 루프를 데이터로 닫는 것**입니다.

이 루프가 닫히면 세 가지가 동시에 가능해집니다.

첫째, Agent-first 전환의 연료가 생깁니다. "어떤 기획이 어떤 성과로 이어졌는가"를 Agent가 참조할 수 있게 됩니다.

둘째, 성과 연동 요금제의 기반이 만들어집니다. CPE 기반 과금은 신뢰할 수 있는 성과 데이터 없이는 설계할 수 없습니다.

셋째, 지금 Mirra에 없는 질문에 답할 수 있게 됩니다. "기획을 거친 콘텐츠와 직접 만든 콘텐츠 중 어느 쪽이 성과가 높은가", "레퍼런스 리서치를 사용한 워크스페이스의 재구독률이 더 높은가" — 이 데이터가 있으면 제품 우선순위 판단이 근거를 갖게 됩니다.

다는 나를 위한 준비이자, 가의 우선순위를 판단하는 도구이기도 합니다.

---

## 2. 첫 1주 계획

스택 기준: Next.js 15 · Vercel serverless · Drizzle ORM · PostHog

### Day 1 — 현황 파악과 기준선 설정

- 기존 코드베이스에서 `post_analytics`, `scheduled_posts`, `content_ideas` 테이블 실제 스키마 확인 (ERD 역공학이 실제 코드와 일치하는지 검증)
- PostHog 대시보드 접근 권한 확보, 현재 수집 중인 이벤트 목록 파악
- `workspace_id`가 PostHog 이벤트 속성에 포함되어 있는지 확인 (병합 가능 여부 판단)
- 기준선 측정: 현재 `content_ideas` 중 `scheduled_posts`까지 이어진 비율, `scheduled_posts` 중 `post_analytics`가 존재하는 비율

### Day 2 — 스키마 마이그레이션

- `content_performance_map` 테이블 생성 (Drizzle 마이그레이션)
- `generation_params` 테이블 생성
- `agent_queries` 테이블 생성 (Agent-first 전환 시 즉시 사용 가능하도록 미리 준비)
- 기존 데이터로 `content_performance_map` 백필 스크립트 작성 및 실행 (끊긴 4-hop 연결 복원)

### Day 3 — 이벤트 적재 파이프라인

- `post_published`, `analytics_synced`, `performance_map_updated` 이벤트를 Vercel serverless function에서 발행하도록 추가
- PostHog에서 `workspace_id`로 조인 가능한 이벤트(`page_viewed`, `feature_abandoned`)를 `content_performance_map`과 연결하는 배치 스크립트 작성
- 크레딧 소비 이벤트(`credit_transactions.feature`)를 콘텐츠 생성 결과와 연결 (기존 데이터 활용)

### Day 4 — 분석 루프 구현

- 루프 1 쿼리 구현: 기획 소스 유형별 평균 참여율 집계
- 루프 2 쿼리 구현: 콘텐츠 포맷·플랫폼별 성과 비교
- 결과를 성과 분석 페이지(`/ko/analytics`)의 "AI 인사이트" 섹션에 연결하는 API 엔드포인트 작성
- 기존 AI 인사이트가 정적 텍스트라면, 이 집계 결과로 대체

### Day 5 — 검증과 정리

- `content_performance_map` 데이터 정합성 검증 (백필 결과 vs 원본 테이블 수동 대조)
- 분석 루프 쿼리 실행 계획 확인 (인덱스 적중 여부)
- 1주 성과 문서화: 연결된 레코드 수, 성과 데이터 커버리지 변화, 발견된 인사이트 1개 이상

---

## 3. 1주가 끝났을 때 달라져야 하는 것

### 기준선 (Day 1에 측정)

| 지표 | 측정 방법 |
|------|-----------|
| 기획 → 발행 연결률 | `content_ideas` 중 `content_performance_map`에 레코드가 있는 비율 |
| 성과 데이터 커버리지 | `scheduled_posts` 중 `post_analytics`가 존재하는 비율 |
| 분석 불가 콘텐츠 비율 | `content_performance_map.content_idea_id IS NULL`인 레코드 비율 |

### 1주 후 목표

| 지표 | 목표 |
|------|------|
| `content_performance_map` 백필 완료 | 기존 발행 콘텐츠의 80% 이상이 단일 레코드로 연결됨 |
| 분석 루프 가동 | 루프 1·2 쿼리가 실제 데이터를 반환하고, AI 인사이트 API에서 호출 가능한 상태 |
| PostHog 병합 가능 여부 확인 | `workspace_id` 조인 가능 여부와 누락 이벤트 목록 문서화 완료 |
| 인사이트 1개 이상 도출 | "기획을 거친 콘텐츠 vs 직접 생성 콘텐츠의 참여율 차이" 등 실제 데이터 기반 발견 |

### 1주 후 달라진 상태

지금은 "어떤 기획이 잘 됐는가"를 Mirra 내부에서 알 수 없습니다. 1주 후에는 `content_performance_map` 하나로 기획 소스 → 생성 방식 → 발행 성과를 단일 쿼리로 조회할 수 있습니다. Agent-first 전환을 시작할 수 있는 데이터 기반이 만들어진 상태입니다.
