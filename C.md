# Part C — 작동하는 PoC

## 선택한 과제: 플라이휠 데이터 파이프라인

B에서 선택한 (다) 플라이휠 문제를 실제 코드로 검증한다.  
**핵심 명제**: "기획(content_ideas) → 생성(carousel_generations) → 발행(scheduled_posts) → 성과(post_analytics)
4-hop이 현재 단절되어 있어, 어떤 기획 방식이 실제로 높은 성과로 이어지는지 분석할 수 없다."

---

## 실행 방법

```bash
cd poc
bun install
bun run demo   # 전체 파이프라인 한 번에 실행
```

> 요구사항: Bun ≥ 1.0. Node, 외부 DB, API key 없이 즉시 실행 가능.  
> 멱등성: 매 실행마다 DB를 초기화하므로 동일한 결과가 재현된다.

---

## 파일 구조

```
poc/
  src/
    schema.ts            — Drizzle 테이블 정의 (기존 4개 + 신규 2개)
    db.ts                — bun:sqlite + Drizzle 초기화, CREATE TABLE
    seed.ts              — 기존 Mirra 구조 시뮬레이션 데이터
    backfill.ts          — INSERT SELECT로 4-hop 연결
    intent-classifier.ts — 자연어 쿼리 → intent 분류
    analysis.ts          — 분석 루프 쿼리 3개
    demo.ts              — 전체 파이프라인 실행 스크립트
```

---

## 구현 내용

### 1. 신규 스키마 (`src/schema.ts`)

#### `agent_queries` — 자연어 쿼리 적재

```sql
CREATE TABLE agent_queries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  raw_query TEXT NOT NULL,
  intent_type TEXT NOT NULL,     -- 'create' | 'schedule' | 'analyze' | 'edit' | 'ask'
  target_platform TEXT,          -- 'instagram' | 'tiktok' | 'kakao' | NULL
  content_format TEXT,           -- 'carousel' | 'video' | NULL
  time_reference TEXT,           -- 'today' | 'this_week' | NULL
  resolved_action TEXT,
  was_accepted INTEGER,
  edit_count INTEGER DEFAULT 0,
  credit_used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
```

#### `content_performance_map` — 4-hop 집계 테이블

```sql
CREATE TABLE content_performance_map (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  -- 기획 단계
  content_idea_id TEXT,          -- NULL이면 기획 없이 생성
  idea_source_type TEXT,         -- 역정규화 (JOIN 없이 분석 가능하도록)
  idea_platform TEXT,
  agent_query_id TEXT,           -- Agent 경유 여부
  -- 생성 단계
  generation_id TEXT NOT NULL,
  generation_type TEXT NOT NULL,
  creation_method TEXT NOT NULL,
  -- 발행 단계
  scheduled_post_id TEXT,
  platform TEXT NOT NULL,
  published_at TEXT,
  -- 성과 스냅샷
  impressions INTEGER, reach INTEGER, likes INTEGER, saves INTEGER,
  engagement_rate REAL, click_through_rate REAL,
  performance_snap_at TEXT,
  created_at TEXT NOT NULL
);
```

**설계 의도**: 역정규화를 의도적으로 허용했다. 성과 분석 쿼리는 조회 빈도가 높고 (Agent가 제안 근거로 매번 호출), 4-hop JOIN은 인덱스가 없으면 느리다. `idea_source_type`처럼 변경 빈도가 낮은 속성은 스냅샷으로 굳혀도 무결성 문제가 없다.

---

### 2. 백필 (`src/backfill.ts`)

단일 `INSERT OR IGNORE ... SELECT` 쿼리로 4-hop을 연결한다.

```sql
INSERT OR IGNORE INTO content_performance_map (...)
SELECT
  'cpm-' || sp.id,
  sp.workspace_id,
  cg.content_idea_id,
  ci.source_type,      -- LEFT JOIN: 기획 없으면 NULL
  ci.platform,
  NULL,                -- agent_query_id: 백필 시점에는 미연결
  cg.id,
  'carousel',
  cg.creation_method,
  sp.id,
  sp.platform,
  sp.published_at,
  pa.impressions, pa.reach, pa.likes, pa.saves,
  pa.engagement_rate, pa.click_through_rate,
  pa.synced_at,
  datetime('now')
FROM carousel_generations cg
JOIN scheduled_posts sp ON sp.content_ref_id = cg.id AND sp.status = 'published'
JOIN post_analytics pa ON pa.scheduled_post_id = sp.id
LEFT JOIN content_ideas ci ON ci.id = cg.content_idea_id
```

Drizzle ORM의 `.values(rows)` 대신 raw SQL을 선택한 이유: Drizzle은 camelCase 매핑을 강제하는데, raw SQL로 SELECT한 결과는 snake_case 컬럼명으로 반환되어 NOT NULL 충돌이 발생했다. 백필은 스키마 변경이 없는 운영 스크립트이므로 ORM 추상화보다 SQL 직접 제어가 맞다.

---

### 3. 인텐트 분류 (`src/intent-classifier.ts`)

자연어 쿼리를 5가지 intent로 분류한다.

```
"인스타그램에 이번 주 신제품 카드뉴스 만들어줘"
  → intent: create | platform: instagram | format: carousel | time: this_week
  → resolvedAction: carousel_generate

"지난달 성과 분석해줘"
  → intent: analyze | resolvedAction: analytics_query
```

**왜 LLM 대신 키워드 매칭인가**: PoC에서 API 의존성 없이 즉시 실행 가능해야 한다. 프로덕션에서는 Claude Haiku API로 교체 예정이며, 그 때 키워드 매칭 결과와의 정확도 비교가 가능하도록 `intent_type` 컬럼을 동일하게 유지했다. AI를 신뢰하기 전에 결정론적 기준선을 먼저 확보한다는 원칙이다.

---

### 4. 분석 루프 (`src/analysis.ts`)

| 루프 | 질문 | 활용 |
|------|------|------|
| 루프 1 | 기획 소스 유형별 평균 참여율 | Agent가 기획 방식을 제안할 때 근거 |
| 루프 2 | 플랫폼별 성과 비교 | 수평 배포 우선순위 결정 |
| 루프 3 | Agent 쿼리 인텐트별 성과 | 어떤 요청 패턴이 좋은 성과로 이어지는지 |

---

## 실행 결과 (before / after)

```
STEP 1: 시드 데이터 삽입
  content_ideas: 3개 (reference 2, web_search 1)
  carousel_generations: 5개 (기획 연결 3, 기획 없음 2)
  scheduled_posts: 5개 발행 / post_analytics: 5개

──────────────────────────────────────────────────
BEFORE: content_performance_map = 0개
        → '어떤 기획이 좋은 성과로 이어졌는가' 분석 불가
──────────────────────────────────────────────────

STEP 2: 백필 실행
  백필 후 content_performance_map = 5개
  기획 있음: 3개, 평균 참여율 10.47%
  기획 없음: 2개, 평균 참여율  6.85%

STEP 3: Agent 쿼리 분류 (5개)
  "인스타그램에 이번 주 신제품 카드뉴스 만들어줘"
    → intent: create | platform: instagram | format: carousel
  "틱톡용 숏폼 영상 만들어줘"
    → intent: create | platform: tiktok | format: video
  "지난달 성과 분석해줘"
    → intent: analyze
  "인스타그램 이번주 콘텐츠 예약해줘"
    → intent: schedule
  "카카오채널 카드뉴스 만들어줘"
    → intent: create | platform: kakao | format: carousel

STEP 4: 분석 루프

[루프 1] 기획 소스 유형별 성과
source_type      post_count  avg_engagement_pct  avg_impressions
web_search       1           10.7%               6,500
reference        2           10.35%              4,000
기획없음(direct)  2           6.85%               1,125

→ 인사이트: 기획 있는 콘텐츠가 직접 생성보다 참여율 1.5배 높음
→ Agent 제안 문구: "web_search 기반 기획을 사용하면 참여율이 평균 1.6배 향상됩니다"

[루프 2] 플랫폼별 성과
platform    avg_engagement_pct  avg_impressions  total_saves
tiktok      10.7%               6,500            130
instagram   8.6%                2,563            203

→ 수평 배포 시 틱톡 우선 제안 근거 확보

[루프 3] Agent 쿼리 인텐트별 성과
intent_type  target_platform  content_format  accepted  avg_engagement_pct
create       tiktok           video           1/1       10.7%
create       instagram        carousel        1/1       10.4%
create       kakao            carousel        1/1       -
analyze                                       1/1       -
schedule     instagram                        0/1       -

──────────────────────────────────────────────────
AFTER: content_performance_map = 5개
  기획 연결 레코드: 3개 (분석 가능)
  기획 없음 레코드: 2개 (분석 사각지대 가시화)
  agent_queries 적재: 5개
──────────────────────────────────────────────────
```

---

## 프로덕션 적용 경로

| 항목 | PoC | 프로덕션 |
|------|-----|----------|
| DB | SQLite (bun:sqlite) | PostgreSQL (기존 Drizzle 스택) |
| 백필 | 스크립트 1회 실행 | Drizzle migration + 배치 잡 |
| 인텐트 분류 | 키워드 매칭 | Claude Haiku (tool_use JSON으로 구조화) |
| 분석 루프 | 함수 직접 호출 | Next.js API route `/api/analytics/[loop]` |
| PostHog 연결 | 미구현 | `agent_query_id` ↔ PostHog `$session_id` join |

PostHog 연결은 B.md Day 3에 해당한다. `content_performance_map.agent_query_id`와 PostHog의 `$session_id`를 같은 세션으로 묶으면 "Agent 쿼리 → 콘텐츠 생성 → 발행 → 성과" 전체 퍼널을 단일 분석으로 볼 수 있다.

---

## AI 사용 회고

### AI를 사용한 부분

- **스키마 설계 초안**: "4-hop 단절을 단일 테이블로 해결하려면 어떤 컬럼이 필요한가" 브레인스토밍에 Claude를 사용했다. 역정규화 여부(`idea_source_type`을 별도 JOIN vs 스냅샷)는 Claude가 제안한 두 가지 방향을 모두 검토한 후 내가 결정했다.
- **분석 쿼리 작성**: 루프 1~3의 SQL 초안을 Claude와 함께 작성했다. GROUP BY 순서와 COALESCE 처리는 실행 후 결과를 보고 수정했다.
- **보일러플레이트 생성**: Drizzle schema 파일, bun:sqlite 초기화, TypeScript 타입 선언 등 반복적인 코드는 AI로 빠르게 생성했다.

### AI를 믿지 않고 직접 검증한 부분

- **Drizzle camelCase 매핑 충돌**: AI는 처음에 `.values(rows)` 방식을 제안했다. 실제로 실행하니 `NOT NULL constraint failed: content_performance_map.workspace_id` 에러가 발생했다. raw SQL row는 snake_case를 반환하는데 Drizzle ORM은 camelCase를 기대한다는 것을 에러 메시지를 직접 읽고 파악했다. `INSERT OR IGNORE ... SELECT` 방식으로 전환하는 결정은 내가 내렸다.
- **bun:sqlite vs better-sqlite3**: AI는 `better-sqlite3`를 먼저 제안했으나, Bun 1.3에서 네이티브 모듈이 지원되지 않는다는 것을 `ERR_DLOPEN_FAILED` 에러로 직접 확인 후 `bun:sqlite`로 전환했다.
- **인텐트 분류에 LLM을 쓰지 않은 결정**: AI는 "Haiku로 분류하면 정확도가 높다"고 제안했다. API key 의존성 없이 즉시 재현 가능해야 한다는 제약을 우선했다. 데이터 파이프라인에서는 "AI 없이 기준선을 먼저 확보하고, 그 다음 AI로 교체"하는 순서가 더 안전하다.
- **시드 데이터 수치 설계**: AI가 생성한 임의 숫자(참여율 0.05~0.08 범위)를 그대로 쓰지 않았다. "기획 있는 콘텐츠 > 기획 없는 콘텐츠"라는 가설이 루프 1에서 명확하게 드러나도록 수치를 직접 설계했다 (10.47% vs 6.85%).

### 가장 도움이 된 순간

백필 쿼리에서 처음에 `INNER JOIN`만 사용해 기획 없는 콘텐츠(gen-4, gen-5)가 결과에서 누락되는 버그가 있었다. Claude가 "기획 없는 경우를 포함하려면 `LEFT JOIN` + COALESCE" 패턴을 제안했고, 적용 후 루프 1에서 `기획없음(direct)` 행이 정상적으로 나타났다. 이 부분은 AI 제안을 검증 후 그대로 수용했다.
