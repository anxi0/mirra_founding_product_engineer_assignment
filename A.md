# Part A — 세 전선에 대한 관점

## 가. 부채

### 1. PRD 엣지케이스 공백 → 바이브 코딩의 흔적

큰 그림은 탄탄하게 기획되어 있습니다. 기획 → 제작 → 예약 → 성과라는 흐름, 크레딧 비용의 명시적 표시, 계정 연동의 안심 라이팅까지 사용자 경험의 주요 경로는 잘 설계되어 있습니다. 그러나 엣지케이스는 다릅니다. 페이월 상태와 콘텐츠 로딩이 겹칠 때, SNS 토큰이 만료된 채 발행을 시도할 때, 크레딧이 부족한 상태에서 여러 기능을 연속 호출할 때 등 이 상황들의 UX가 명세된 흔적이 없습니다. 이는 PRD가 해피패스 중심으로 작성되고 빠르게 구현된, 전형적인 바이브 코딩의 결과물입니다. 지금은 기능이 제한적이라 버텨지고 있지만, Agent-first 전환이나 기능 확장이 이루어지면 이 공백에서 버그가 발생할 것입니다. 구조적으로 무너지기 쉬운 이유는 코드가 나빠서가 아니라, 예외 시나리오가 명세 단계에서 빠졌기 때문입니다.

**하네스 방향:** 엣지케이스를 코드가 아닌 테스트로 먼저 명세합니다. "토큰 만료 상태에서 발행 시도 시 어떤 상태를 반환해야 하는가"를 Vitest 테스트로 고정한 뒤 구현하는 방식으로, PRD 공백을 테스트 파일이 채우는 구조를 만듭니다.

### 2. 기능은 충분하나 IA 흐름이 충돌

SNS 마케팅에 필요한 기능은 거의 다 들어 있습니다. 문제는 그 기능들이 어떤 축으로 묶여 있느냐입니다. 현재 사이드바는 기능 단위(레퍼런스 리서치 / AI 컨텐츠 스타일 / 콘텐츠 생성 / 캘린더)로 분류되어 있는데, 사용자는 기능이 아닌 목적 단위로 움직입니다. 두 가지 대안이 있습니다. 하나는 세로축—기획 → 제작 → 예약 → 성과·전략수정이라는 일관된 워크플로우로 묶는 방식입니다. 다른 하나는 가로축—인스타그램, 카카오채널 등 SNS를 먼저 선택하고 그 채널 안에서 게시글 하나를 끝까지 추적하는 방식입니다. 둘 중 어느 축이 맞는지는 사용자 데이터로 검증해야 하지만, 지금은 어느 축도 일관되게 적용되지 않아 혼란을 가중하고 있습니다. 이는 기능 추가 순서대로 IA가 쌓인 구조적 부채입니다.

**하네스 방향:** IA 리팩토링 전에 현재 네비게이션 클릭 패턴 이벤트를 먼저 심습니다. 어느 메뉴 경로로 실제 콘텐츠 발행까지 도달하는지 데이터가 없으면, 어느 축으로 재정렬해야 하는지 판단할 수 없기 때문입니다.

### 3. 언어별 UI 깨짐 → 컴포넌트 설계와 테스트 가드레일 부재

다국어 SaaS임에도 언어에 따라 UI가 깨지는 지점이 존재합니다. 이는 번역 품질의 문제가 아닙니다. 텍스트 길이가 달라질 때를 가정하지 않은 컴포넌트 설계—고정 너비 버튼, 말줄임 처리 없는 레이블, flex 레이아웃에서 넘치는 텍스트—가 원인입니다. 그리고 이 깨짐이 배포까지 올라온다는 것은 다국어 스냅샷 테스트나 시각적 회귀 테스트가 없다는 의미입니다. 기능이 추가될 때마다 새 언어에서 같은 문제가 반복되고 있습니다.

**하네스 방향:** Storybook + Chromatic(또는 Percy)으로 한/영 스냅샷을 CI에서 자동 비교합니다. 컴포넌트 단에서 `min-width: 0`, `overflow-wrap`, `line-clamp` 패턴을 공통 가이드로 정의해 신규 컴포넌트가 처음부터 다국어를 고려하도록 강제합니다.

## 나. 신규

### 현재 제품 구조에서 발견한 문제

직접 탐색을 통해 확인한 IA는 다음과 같습니다.

**사이드바 구조:** AI로 기획 (콘텐츠 기획 / 레퍼런스 리서치 / AI 컨텐츠 스타일) → AI로 콘텐츠 제작 (URL→콘텐츠 / 카드뉴스 생성 / 영상 생성 / 블로그 생성) → 콘텐츠 관리 → 콘텐츠 성과 → 댓글 관리 → 자동 DM

표면상 세로축(워크플로우) 구조처럼 보이지만, 실제로는 두 가지 문제가 있습니다.

첫째, **기능 단위 분류가 목적 단위 이동을 방해합니다.** 레퍼런스 리서치는 베타 뱃지를 달고 기획 하위에 숨어 있고, 블로그 생성은 SNS 콘텐츠 제작 하위에 묶여 있는 등 각 기능의 위계가 일관되지 않습니다. 사용자는 "내 인스타그램 이번 주 콘텐츠"라는 목적 단위로 움직이는데, 제품은 기능을 먼저 고르도록 강제합니다.

둘째, **진입 상태 감지가 없습니다.** 콘텐츠 기획 페이지(/ko/planning)에서 "계정을 선택하세요" 드롭다운이 SNS 계정 0개 상태에서도 그대로 노출됩니다. 홈 화면에서는 크레딧 잔액이 항상 노출되지만 크레딧 부족 상태에서 기획-제작-예약을 연속 호출할 때 어느 시점에서 어떤 메시지를 보여줄지 명세가 없습니다. 기능 내부에서 실패가 나는 구조입니다.

이 두 문제는 Agent-first 전환과 직결됩니다. 사용자가 자연어로 의도를 말할 때, 현재 구조로는 agent가 "어느 사이드바 메뉴를 먼저 클릭해야 하는지"를 선택하게 만드는 UI 레이어를 그대로 떠안게 됩니다.

**단, 기존 UI는 버리는 것이 아니다**

Agent-first로 전환하더라도 클릭 인터페이스를 선호하는 사용자는 여전히 많습니다. 현재 사이드바 기반 UI는 HITL(Human-in-the-Loop) 레이어 — 모든 액션에 사람이 직접 개입하는 방식 — 로 유지·개선해야 합니다. 부채 리팩토링의 목적은 UI를 제거하는 것이 아니라, 이 UI가 Agent flow와 공존할 수 있도록 구조를 정비하는 것입니다. 진입 게이트 UI, i18n 수정, IA 개선은 모두 "클릭 인터페이스를 더 잘 작동하게 만들면서 동시에 Agent 레이어가 같은 기능을 호출할 수 있도록" 하는 방향으로 설계해야 합니다.

### Agent-first 재설계 방향

**핵심 원칙:** 사용자의 발화는 항상 채널 + 의도 + 시점의 조합입니다. "인스타그램에 이번 주 신제품 소개 올려줘"가 그 예입니다. 현재 제품은 이 발화를 받아서 기획 → 제작 → 예약 각 단계를 사용자가 수동으로 이어야 합니다. Agent-first 설계는 이 흐름을 agent가 오케스트레이션하고 사용자는 승인과 수정만 하는 구조로 바꿉니다.

**Agent 인터페이스 뒤로 재배치할 기능들 (남길 것)**

- 콘텐츠 생성 (카드뉴스, 영상, 블로그): agent가 채널 특성에 맞는 포맷을 자동 선택하여 초안 생성. 사용자는 승인/수정만.
- 예약 발행: agent가 성과 데이터 기반으로 최적 발행 시간대를 제안, 사용자 확인 후 실행.
- 댓글 관리: agent가 댓글 분류(질문 / 불만 / 긍정) 후 답변 초안 제시. 사용자는 선택적으로 수정.
- 자동 DM: 트리거 조건 설정은 agent가 성과 패턴에서 제안, 사용자 승인으로 활성화.

**현재 UI 레이어에서 제거하거나 숨길 것 (버릴 것)**

- 기능별 사이드바 메뉴 구조: 채널 선택 → 자연어 입력이라는 단일 진입점으로 대체. 기존 기능 메뉴는 "고급 설정"으로 축소.
- 레퍼런스 리서치 독립 메뉴: agent가 기획 과정에서 자동으로 참조. 사용자가 따로 진입할 필요 없음.
- AI 컨텐츠 스타일 독립 메뉴: 채널별 스타일 프로파일로 내재화. 최초 1회 설정 후 agent가 자동 적용.
- 크레딧/계정 연동 상태를 기능 내부에서 처리하는 구조: 진입 전 가드 레이어로 이동. "이 기능을 사용하려면 X가 필요합니다"라는 인라인 게이트를 agent 실행 전 단계에서 선제적으로 처리.

### 재배치 후 사용자 흐름 예시

```
[현재]
사이드바 → 콘텐츠 기획 클릭 → 계정 선택 → 주제 입력 → 저장
→ 사이드바 → 카드뉴스 생성 클릭 → 이전 기획 불러오기 → 생성
→ 사이드바 → 캘린더 → 예약 설정

[Agent-first]
채널 선택 (인스타그램) → "이번 주 신제품 소개 카드뉴스 만들어줘"
→ agent: 기획 초안 제시 → 사용자 승인
→ agent: 카드뉴스 3안 생성 → 사용자 선택
→ agent: 최적 발행 시간 제안 (목 오후 7시) → 사용자 확인
→ 예약 완료
```

크레딧 부족, 계정 미연동, 토큰 만료는 agent가 발화를 받는 시점에 선제적으로 감지하여 흐름을 막는 대신 해결 경로("계정을 연동하면 시작할 수 있습니다")를 제시합니다.

### HITL → HOTL → HOOTL: 자동화 단계 로드맵

Agent-first 재설계의 최종 목적은 완전 자동화(HOOTL)가 가능한 구조를 만드는 것입니다. 그러나 이것은 단계적으로 도달해야 하며, 세 가지 자동화 수준을 사용자가 선택할 수 있어야 합니다.

```
HITL (Human-in-the-Loop)   — 현재 + Agent 도입 초기
  모든 액션에 사람이 승인. Agent는 제안만 한다.
  "카드뉴스 3안 생성 → 사용자가 선택 → 예약 확인 → 발행"

HOTL (Human-on-the-Loop)   — 신뢰 누적 후
  Agent가 실행하고, 사람은 예외 상황에만 개입.
  "Agent가 성과 패턴 기반으로 콘텐츠 생성·예약 → 이상 감지 시에만 알림"

HOOTL (Human-out-of-the-Loop) — 완전 자동화
  Agent가 기획·제작·예약·댓글 대응을 자율 실행.
  사람은 결과를 리포트로 확인.
```

세 단계 모두에서 클릭 인터페이스(기존 UI)는 병렬로 제공됩니다. 자동화 수준은 사용자가 선택하는 것이지, 제품이 강제하는 것이 아닙니다.

**어느 단계에서도 인간이 반드시 개입해야 하는 가드레일 3개**

첫째, **최초 발행 시 최종 승인**입니다. 콘텐츠의 독창성과 브랜드 일관성은 레퍼런스 데이터를 가진 AI가 아니라 사람이 결정해야 합니다. 완전히 동일한 포맷의 콘텐츠를 반복 발행하는 경우에도, 처음 만들어지는 콘텐츠에 대한 최종 승인 게이트는 항상 사람에게 있어야 합니다.

둘째, **위기·민감 댓글 대응**입니다. AI가 초안을 생성하더라도, 브랜드 평판에 영향을 줄 수 있는 댓글의 최종 답변은 사람이 결정해야 합니다. 가드레일 없이 자동화된 댓글 대응은 브랜드 위기를 증폭시킬 수 있습니다.

셋째, **요금제·결제 액션**입니다. 크레딧 자동 충전, 플랜 업그레이드 등 돈이 오가는 액션은 항상 사용자 명시적 승인이 필요합니다. 돈을 받는 서비스에서 결제 자동화는 신뢰의 문제입니다.

### 채널별 워크스페이스 뷰 (전환 전략)

Agent-first 전면 전환 전 중간 단계로, 현재 기능 단위 사이드바는 유지하면서 "채널 퍼스트" 뷰를 상단에 추가합니다. 인스타그램, 카카오채널 등 연동된 계정을 선택하면 해당 채널의 기획-제작-예약-성과를 하나의 뷰에서 추적할 수 있도록 합니다. 동시에 어느 뷰에서 실제 발행까지 도달하는지 클릭 이벤트를 로깅하면, 이후 어느 축으로 IA를 통합할지 결정하는 데이터가 모입니다.

### 두 가지 추가 제안: 비즈니스 모델과 지표 번역

Agent-first 재설계가 완성되면 자연스럽게 두 가지 전환이 가능해집니다.

**1. 성과 연동 요금제**

현재 크레딧 모델은 마케팅 경험자에게 구조적으로 불합리합니다. 콘텐츠를 만들었는데 반응이 0이어도 크레딧은 똑같이 소진되고, 광고비 대비 ROI 계산이 불가능하며, 크레딧이 떨어지면 업그레이드 압박으로 이어집니다. 마케터의 언어로 말하면 "성과 없이 비용만 나가는 구조"입니다.

Agent-first로 전환하면 성과 데이터(도달, 참여, 클릭)가 Mirra 안에 축적됩니다. 이 데이터를 과금 기준으로 연결하면 CPC(클릭당), CPV(조회당), CPE(참여당) 방식의 종량제가 가능해집니다. 발행 건당 과금은 악용 가능성이 있으므로, 실제 반응이 발생했을 때만 과금되는 참여 기반 모델이 가장 적합합니다. 콘텐츠가 반응 없이 묻히면 비용이 발생하지 않고, 잘 터지면 그만큼 지불하는 구조입니다.

이 모델은 Agent-first 없이는 구현할 수 없습니다. Agent가 성과 데이터를 내재화한 상태에서 다음 기획을 제안하는 루프가 먼저 작동해야, 과금 기준으로 쓸 수 있는 신뢰할 만한 성과 데이터가 쌓이기 때문입니다.

**2. 지표 번역 레이어**

마케터는 CTR, CVR, CPM을 보며 즉시 판단합니다. 소상공인은 같은 숫자를 봐도 "그래서 뭘 해야 해?"를 모릅니다. 현재 성과 분석 페이지의 "AI 인사이트"는 이 간극을 메우려는 시도이지만, 사용자가 페이지를 직접 방문해야만 볼 수 있고, 여전히 숫자 중심입니다.

Agent가 성과를 사용자 수준에 맞는 언어로 번역하면 이 문제가 해결됩니다.

```
[마케팅 초보 — 소상공인]
"이번 주 카드뉴스가 팔로워 47명을 새로 데려왔어요.
지난달보다 2배 좋은 결과예요. 이번 달도 같은 형식으로 만들까요?"

[마케팅 경험자 — 에이전시]
"CTR 3.2% / CVR 1.8% / 참여율 +22% (전월 대비)
카드뉴스 포맷이 영상 대비 CPE 41% 낮음. 다음 주 캠페인 추천: 카드뉴스 3편"
```

같은 데이터를 두 언어로 제공합니다. Agent가 사용자의 질문 패턴과 플랜(Starter vs Agency)을 보고 어느 수준으로 설명할지 자동 조정하면, 별도 설정 없이도 작동합니다.

이 두 제안은 독립적이지 않습니다. "Agent가 성과를 쉬운 언어로 보여주고 → 그 성과에 비례해서 비용을 낸다"는 하나의 흐름입니다. Agent-first 전환이 UX 개선이 아니라 비즈니스 모델 전환의 기반이 된다는 논거입니다.

## 다. 플라이휠

### 현재 구조의 세 가지 공백

UI 역공학으로 파악한 현재 스키마에는 플라이휠을 막는 공백이 세 곳 있습니다.

**공백 1 — 기획과 성과 사이에 직접 연결이 없다**

`content_ideas → carousel_generations → scheduled_posts → post_analytics`라는 4-hop을 거쳐야 하고, `carousel_generations.content_idea_id`가 nullable이라 기획 없이 만든 콘텐츠는 성과와 아예 연결되지 않습니다. "어떤 기획이 좋은 성과를 냈는가"를 지금 구조로는 분석할 수 없습니다.

**공백 2 — AI 생성 파라미터가 저장되지 않는다**

`carousel_generations`에는 topic, aspect_ratio 정도만 기록됩니다. 어떤 프롬프트로 만들었는지, 사용자가 결과를 수정했는지, 몇 번 재생성했는지가 남지 않습니다. Agent-first 전환의 연료인 "잘 통한 생성 패턴" 학습이 현재 구조로는 불가능합니다.

**공백 3 — 행동 데이터가 비즈니스 데이터와 분리되어 있다**

browse 세션 쿠키에서 `ph_phc_...posthog` 키가 확인됐습니다. PostHog가 이미 붙어 있다는 뜻입니다. 행동 이벤트(클릭, 이탈, 페이지 전환)는 PostHog에 있고, 비즈니스 데이터(기획·생성·발행·성과)는 Drizzle DB에 있습니다. 두 소스가 `workspace_id`로 연결되지 않아 "기획 페이지에서 이탈한 사용자 중 최종 발행까지 도달한 비율"을 지금은 계산할 수 없습니다.

Agent-first 전환이 되면 세 번째 소스가 생깁니다. 사용자의 자연어 쿼리가 1차 인텐트 데이터가 됩니다. 이 세 소스를 병합하는 것이 플라이휠 설계의 핵심입니다.

```
PostHog     → 행동 데이터 (클릭·이탈·페이지 전환)
Drizzle DB  → 비즈니스 데이터 (기획→생성→발행→성과)
Agent 쿼리  → 인텐트 데이터 (사용자가 무엇을 원하는가)  ← 현재 없음
```

---

### 추가해야 할 스키마

#### `agent_queries` (신규)

Agent-first 전환 시 모든 자연어 발화를 이벤트로 적재합니다. 쿼리 자체가 "고객이 Mirra에서 무엇을 원하는가"를 보여주는 1차 데이터입니다.

```sql
CREATE TABLE agent_queries (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid        NOT NULL REFERENCES workspaces(id),
  user_id           uuid        NOT NULL REFERENCES users(id),

  -- 인텐트 분류
  raw_query         text        NOT NULL,           -- "인스타그램에 이번 주 카드뉴스 만들어줘"
  intent_type       varchar     NOT NULL,           -- 'create' | 'schedule' | 'analyze' | 'edit' | 'ask'
  target_platform   varchar,                        -- 'instagram' | 'tiktok' | null
  content_format    varchar,                        -- 'carousel' | 'video' | 'blog' | null
  time_reference    varchar,                        -- 'this_week' | 'tomorrow' | null

  -- 실행 추적
  resolved_action   varchar,                        -- 'carousel_generate' | 'schedule' | 'analytics_query' | null
  output_ref_id     uuid,                           -- 생성된 결과물 ID (nullable)
  output_ref_table  varchar,                        -- 'carousel_generations' | 'scheduled_posts' | null

  -- 결과
  was_accepted      boolean,                        -- 사용자가 결과를 수락했는가
  edit_count        integer     DEFAULT 0,          -- 수락 전 수정 횟수
  credit_used       integer     DEFAULT 0,

  session_id        uuid,                           -- 대화 세션 단위 묶음
  created_at        timestamp   NOT NULL DEFAULT now()
);

CREATE INDEX ON agent_queries (workspace_id, created_at);
CREATE INDEX ON agent_queries (intent_type, target_platform);
```

#### `generation_params` (신규)

기존 `carousel_generations`, `video_generations`에 생성 파라미터와 수정 이력을 추가합니다. 별도 테이블로 분리해 기존 테이블 구조를 유지합니다.

```sql
CREATE TABLE generation_params (
  id                  uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id       uuid      NOT NULL,           -- carousel_generations.id 또는 video_generations.id
  generation_type     varchar   NOT NULL,           -- 'carousel' | 'video' | 'blog'

  -- AI 생성 파라미터
  system_prompt_hash  varchar,                      -- 프롬프트 버전 추적 (전문 저장 X)
  user_prompt         text,                         -- 사용자가 입력한 프롬프트
  model_id            varchar,                      -- 사용된 모델 식별자
  generation_attempt  integer   DEFAULT 1,          -- 재생성 횟수

  -- 사용자 피드백
  user_accepted       boolean,
  user_edited         boolean   DEFAULT false,
  edit_delta          jsonb,                        -- 수정 전후 diff (슬라이드 단위)
  time_to_accept_sec  integer,                      -- 생성 → 수락까지 걸린 시간(초)

  created_at          timestamp NOT NULL DEFAULT now()
);

CREATE INDEX ON generation_params (generation_id, generation_type);
```

#### `content_performance_map` (신규)

기획 → 생성 → 발행 → 성과의 4-hop을 단일 테이블로 직접 연결합니다. 집계 쿼리 성능을 위한 역정규화 테이블입니다.

```sql
CREATE TABLE content_performance_map (
  id                    uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid      NOT NULL REFERENCES workspaces(id),

  -- 기획 단계
  content_idea_id       uuid      REFERENCES content_ideas(id),        -- nullable (기획 없이 생성된 경우)
  agent_query_id        uuid      REFERENCES agent_queries(id),         -- nullable (Agent 경유 여부)

  -- 생성 단계
  generation_id         uuid      NOT NULL,
  generation_type       varchar   NOT NULL,           -- 'carousel' | 'video' | 'blog'

  -- 발행 단계
  scheduled_post_id     uuid      REFERENCES scheduled_posts(id),
  social_account_id     uuid      REFERENCES social_accounts(id),
  published_at          timestamp,

  -- 성과 단계 (스냅샷 — 집계 기준일 기준)
  impressions           integer,
  reach                 integer,
  engagement_rate       decimal,
  click_through_rate    decimal,
  saves                 integer,
  performance_snapped_at timestamp,

  created_at            timestamp NOT NULL DEFAULT now()
);

CREATE INDEX ON content_performance_map (workspace_id, published_at);
CREATE INDEX ON content_performance_map (content_idea_id);
CREATE INDEX ON content_performance_map (agent_query_id);
```

---

### 이벤트 설계

PostHog에 이미 행동 이벤트가 쌓이고 있으므로, 누락된 비즈니스 이벤트만 추가합니다. 모든 이벤트는 `workspace_id`를 공통 키로 PostHog와 병합 가능하도록 설계합니다.

**추가가 필요한 이벤트 (현재 누락)**

```
agent_query_submitted       -- Agent에 쿼리 입력 시
agent_result_accepted       -- Agent 결과 수락 시 (was_accepted = true)
agent_result_rejected       -- 재생성 요청 시 (edit_count++)
agent_result_edited         -- 수락 전 수정 시 (edit_delta 기록)

generation_started          -- 생성 시작 (credit 차감 전)
generation_completed        -- 생성 완료 (output_ref_id 기록)
generation_failed           -- 생성 실패 (credit 차감 없음)

post_published              -- 발행 완료 (platform_post_id 수신)
post_failed                 -- 발행 실패 (token 만료 등 원인 기록)

analytics_synced            -- 성과 데이터 동기화 완료
performance_map_updated     -- content_performance_map 갱신
```

**PostHog에서 가져올 기존 이벤트 (workspace_id로 조인)**

```
page_viewed(planning)       -- 기획 페이지 방문
page_viewed(calendar)       -- 캘린더 방문
feature_abandoned           -- 기능 진입 후 이탈 (어느 단계에서)
credit_warning_shown        -- 크레딧 부족 경고 노출
```

---

### 분석 루프

세 소스를 병합하면 다음 분석이 가능해집니다.

**루프 1 — 기획 품질 피드백**

```sql
-- 어떤 기획 소스(self_create vs reference vs web_search)가
-- 높은 성과로 이어지는가
SELECT
  ci.source_type,
  AVG(cpm.engagement_rate)  AS avg_engagement,
  AVG(cpm.impressions)      AS avg_impressions,
  COUNT(*)                  AS post_count
FROM content_performance_map cpm
JOIN content_ideas ci ON cpm.content_idea_id = ci.id
WHERE cpm.workspace_id = :workspace_id
  AND cpm.published_at >= NOW() - INTERVAL '30 days'
GROUP BY ci.source_type
ORDER BY avg_engagement DESC;
```

이 결과를 Agent가 다음 기획 제안 시 자동으로 참조합니다. "레퍼런스 리서치를 거친 기획이 직접 작성한 기획보다 참여율 2.3배 높습니다"라는 제안의 근거가 됩니다.

**루프 2 — Agent 인텐트 → 성과 연결**

```sql
-- Agent 쿼리 인텐트별 성과 비교
-- "어떤 요청 패턴이 실제로 잘 되는 콘텐츠로 이어지는가"
SELECT
  aq.intent_type,
  aq.content_format,
  aq.target_platform,
  AVG(cpm.engagement_rate)  AS avg_engagement,
  AVG(aq.edit_count)        AS avg_edits_before_accept,
  COUNT(*)                  AS total_queries
FROM agent_queries aq
JOIN content_performance_map cpm ON cpm.agent_query_id = aq.id
WHERE aq.workspace_id = :workspace_id
GROUP BY aq.intent_type, aq.content_format, aq.target_platform
ORDER BY avg_engagement DESC;
```

**루프 3 — 생성 파라미터 → 성과 학습**

```sql
-- 어떤 생성 패턴(재생성 횟수, 수정 여부)이 높은 성과로 이어지는가
SELECT
  gp.generation_attempt,
  gp.user_edited,
  AVG(cpm.engagement_rate) AS avg_engagement,
  COUNT(*)                 AS sample_size
FROM generation_params gp
JOIN content_performance_map cpm
  ON cpm.generation_id = gp.generation_id
  AND cpm.generation_type = gp.generation_type
GROUP BY gp.generation_attempt, gp.user_edited
ORDER BY avg_engagement DESC;
```

---

### 플라이휠 루프 요약

```
[1] Agent 쿼리 적재
    사용자 발화 → agent_queries (인텐트 분류)

[2] 생성 파라미터 저장
    생성 실행 → generation_params (프롬프트·수정 이력)

[3] content_performance_map 갱신
    발행 → 성과 동기화 → 4-hop을 단일 레코드로 압축

[4] 분석 루프 실행
    루프 1·2·3 쿼리 → Agent 제안 품질 향상

[5] 향상된 제안 → 더 높은 성과 → 더 많은 데이터 축적
    → 루프 반복
```

현재 구조에서 [3]까지는 데이터가 존재하지만 연결이 끊겨 있습니다. [1][2]는 Agent-first 전환 시 신규 생성됩니다. `content_performance_map`이 이 세 소스를 하나의 집계 테이블로 묶는 연결 키입니다.
