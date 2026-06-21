# A-context — Part A 작성 배경 대화 정리

## 가. 부채 — 탐색 기반 관찰

직접 제품을 사용하며 발견한 구조적 문제 세 가지:

1. **PRD 엣지케이스 공백 (바이브 코딩의 흔적)**
   - 홈 화면에서 카드 세 개가 로딩 직후 비어있다가 뒤늦게 채워짐 → 페이월 상태와 카드 렌더링의 race condition 가능성
   - `/ko/planning`에서 SNS 계정 0개 상태에서도 "계정을 선택하세요" 드롭다운이 그대로 노출
   - 크레딧 부족 상태에서 기획-제작-예약 연속 호출 시 어느 시점에 어떤 메시지를 보여줄지 명세 없음
   - 제안: 진입 전 가드 레이어 + Vitest로 엣지케이스 먼저 테스트로 고정

2. **IA 흐름 충돌**
   - 사이드바가 기능 단위(레퍼런스 리서치 / AI 컨텐츠 스타일 / 콘텐츠 생성 / 캘린더)로 분류됨
   - 레퍼런스 리서치는 "베타" 뱃지 달고 기획 하위에 숨어 있음 → 팀도 이 메뉴 위치에 확신 없다는 신호
   - 콘텐츠 성과 분석이 콘텐츠 관리와 병렬 나열 (워크플로우 마지막 단계임에도)
   - 제안: 데이터 수집 후 어느 축(세로/가로)으로 재정렬할지 판단, 지금은 클릭 이벤트 로깅 먼저

3. **다국어 UI 깨짐**
   - 한/영 404 페이지에서 `common.pageNotFound`, `common.pageNotFoundDescription`, `common.backToHome` i18n 키가 그대로 노출 (이미 배포 환경)
   - 영어 홈 초기 로드 시 카드 플래시 현상이 한국어보다 더 오래 지속
   - 제안: 빌드 시점 i18n 키 린트 룰 + 텍스트 오버플로우 안전 컴포넌트 공통화

---

## 나. 신규 — 브라우저 탐색 + Agent-first 분석 대화

### 제품 실제 URL 구조 (탐색 결과)

- 기획: `/ko/ai/bulk-generate`, `/ko/ai/trend-repurpose`, `/ko/social-accounts`(AI 컨텐츠 스타일)
- 제작: `/ko/ai/bulk-link-to-post`, `/ko/carousel-lab/create`, `/ko/shorts-lab/create`, `/ko/ai/longform`
- 관리/분석: `/ko/calendar`, `/ko/analytics`, `/ko/engagement/replies`, `/ko/automation/dm`
- 요금제: 무료(60크레딧) → Starter $9 → Standard $19 → Pro $49 → Agency $99 → 엔터프라이즈

### 핵심 논의: 현재 플라이휠의 구조적 문제

현재 구조는 "기능을 많이 쓸수록 크레딧이 소진되고 업그레이드한다"는 **선형 소진 모델**. 플라이휠이 아님.
- 레퍼런스 리서치 → 기획 → 제작 → 예약 → 성과 분석이 별도 페이지에 흩어짐
- 이전 단계의 output이 다음 단계의 input으로 자동 연결되지 않음
- 사용자가 매번 수동으로 다음 메뉴로 이동해야 함

### Agent-first 재배치 원칙

- 남길 것: 콘텐츠 생성(포맷 자동 선택), 예약 발행, 댓글 관리, 자동 DM, 캘린더(인라인 패널), URL→콘텐츠(링크 드롭), AI 컨텐츠 스타일(장기 메모리), 크레딧(대화 인라인)
- 버릴 것(또는 격리): 레퍼런스 리서치 독립 메뉴, 기획 칸반(3칸), 카드뉴스 4-step 위저드 UI, 블로그 생성(메인 플로우 밖으로)
- 전환 순서: 성과↔기획 파이프라인 먼저 → 자연어 인터페이스 → 기존 UI 대체

### 추가 논의 1: 성과 연동 요금제 (CPC/CPV)

**사용자 의견:** 크레딧 모델은 마케팅 경험자에게 불합리. 성과 없이 비용만 나가는 구조. CPC/CPV처럼 성과 기준 종량제가 필요하다.

**핵심 논거:**
- 크레딧 모델의 4가지 문제: 성과와 무관하게 소진 / 사용량 예측 불가 / 광고비 대비 ROI 계산 불가 / 업그레이드 압박
- 발행 건당 과금은 악용 가능성 → 참여(Engagement) 기반이 적합
- 도달(Reach)은 알고리즘 변수, 참여(좋아요·댓글·저장)는 콘텐츠 품질에 직결 → Mirra가 책임질 수 있는 단위
- Agent-first 없이는 구현 불가 → 성과 데이터가 먼저 축적되어야 신뢰할 수 있는 과금 기준이 생김

### 추가 논의 2: 지표 번역 레이어

**사용자 의견:** 마케터는 CTR, CVR을 보지만 소상공인은 모른다. 쉬운 언어로 제공하면 좋겠다.

**설계 방향:**
```
[마케팅 초보 — 소상공인]
"이번 주 카드뉴스가 팔로워 47명을 새로 데려왔어요. 지난달보다 2배 좋은 결과예요."

[마케팅 경험자 — 에이전시]
"CTR 3.2% / CVR 1.8% / 참여율 +22% (전월 대비). 카드뉴스 CPE 41% 낮음."
```
- Agent가 사용자 질문 패턴 + 플랜(Starter vs Agency)으로 수준 자동 조정
- "Agent가 성과를 쉬운 언어로 보여주고 → 그 성과에 비례해서 비용을 낸다"는 하나의 흐름

---

## 다. 플라이휠 — 스키마 역공학 + 데이터 구조 대화

### UI 역공학으로 파악한 현재 스키마 공백

1. **기획 ↔ 성과 연결 없음**: `content_ideas → carousel_generations → scheduled_posts → post_analytics` 4-hop, `content_idea_id` nullable
2. **AI 생성 파라미터 미저장**: 어떤 프롬프트, 수정 여부, 재생성 횟수 기록 안 됨
3. **행동 데이터와 비즈니스 데이터 분리**: PostHog(`ph_phc_...posthog` 쿠키 확인) + Drizzle DB가 분리됨

### PostHog 발견

browse 세션 쿠키에서 `ph_phc_DyuiTckElEXcyfStTr1OeSy9HiW8JjxJ6btgLTxMEBQ_posthog` 확인.
- Gap 3의 정확한 표현: "이벤트가 없는 게 아니라 PostHog에 있고 DB와 분리되어 있다"
- 세 데이터 소스: PostHog(행동) + Drizzle DB(비즈니스) + Agent 쿼리(인텐트, 현재 없음)
- 병합 키: `workspace_id`

### 설계한 신규 스키마 3개

- `agent_queries`: 자연어 발화 적재 (intent_type, target_platform, content_format, was_accepted, edit_count)
- `generation_params`: AI 생성 파라미터 + 사용자 피드백 (system_prompt_hash, user_edited, edit_delta, time_to_accept_sec)
- `content_performance_map`: 기획→생성→발행→성과 4-hop을 단일 레코드로 연결 (역정규화 집계 테이블)

### 분석 루프 3개

- 루프 1: 기획 소스 유형별 평균 참여율 → Agent 기획 제안 근거
- 루프 2: Agent 쿼리 인텐트·포맷·플랫폼별 성과 → "어떤 요청 패턴이 잘 됐는가"
- 루프 3: 생성 파라미터(재생성 횟수, 수정 여부) vs 성과 → 생성 품질 학습
