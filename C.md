# Part C — 작동하는 PoC

## 선택한 과제: 가입 직후 온보딩 설문 플로우

B에서 선택한 (가) 방향 — 퍼널 정비 — 의 핵심 진입점을 PoC로 구현한다.

**핵심 명제**: "가입 직후 사용자가 뭘 해야 할지 모른다. 목적 기반 설문으로 SNS 연동까지 바로 이어지면, 연동 전환율이 올라가고 Activation 속도가 빨라진다."

실제 수치는 B.md Day 2 코호트 분석(PostHog)으로 확인해야 하며, 이 PoC는 그 분석이 나오기 전에 플로우 자체의 타당성을 먼저 증명하기 위한 것이다.

---

## 실행 방법

```bash
cd poc
npm install
npm run dev  # http://localhost:3000
```

> 요구사항: Node ≥ 18, `.env.local`에 Supabase 환경변수 필요.
> Vercel 배포 버전: https://poc-three-blush.vercel.app/

---

## 플로우 설계

```
가입 (Google OAuth)
 └→ 설문 (4지선다)
      ├→ [1] 페르소나로 SNS 자동화   → SNS 선택 → 연동 → 페르소나 설정 → 완료
      ├→ [2] 기존 SNS 성과 향상      → SNS 선택 → 연동 → 성과 분석 결과 → 완료
      ├→ [3] 글 한 번 원격으로 써보기 → 콘텐츠 기획받기 → 아이디어 생성 → SNS 선택 → 연동 → 완료
      └→ [4] 아이디어가 없어서        → 아이디어 발산 → SNS 선택 → 연동 → 완료
```

※ 이미 SNS 연동 이력이 있는 사용자는 SNS 선택·연동 스텝을 건너뛰고 바로 목적 화면으로 이동한다.

### 설계 근거

**왜 선택지별로 다른 경로를 만들었는가**

모든 경로를 "SNS 선택 → 첫 발행"으로 통일하면 구현이 단순하다. 그러나 사용자가 "아이디어가 없다"고 말했는데 연동부터 시키면 "연동하고 나서 뭘 하죠?"가 된다. 가치 경험(아이디어 생성, 성과 확인)을 먼저 보여준 뒤 연동 넛지를 주는 것이 저항이 낮다.

**[1] 페르소나 경로가 SNS 연동 직후 페르소나 설정으로 가는 이유**

브랜드 톤과 타겟을 AI에게 알려주는 것은 "어떤 계정을 자동화할 것인가"가 결정된 뒤에야 의미가 있다. SNS 연동 전에 페르소나를 입력받으면 어느 계정에 쓸지 모르는 설정이 된다.

**[2] 성과 분석 경로가 mock 데이터를 쓰는 이유**

실제 SNS API 연동은 OAuth + 플랫폼별 API 구현이 필요해 PoC 범위를 벗어난다. mock 데이터로 "연동 후 이런 분석이 나온다"는 UX를 먼저 보여주는 것이 목적이다.

**[3] 글 써보기 경로가 SNS 선택을 나중으로 미루는 이유**

글을 쓰고 싶은 사용자는 아직 어느 채널에 올릴지 결정하지 않았을 수 있다. 아이디어와 초안을 받은 뒤 "어디에 올릴까요?"가 더 자연스러운 순서다.

---

## 파일 구조

```
poc/
  src/
    app/
      onboarding/page.tsx     — 온보딩 전체 플로우 (React 상태 머신)
      api/
        chat/route.ts         — [5번 경로] Claude API 스트리밍 대화
        ideas/route.ts        — [3·4번 경로] Claude API 콘텐츠 아이디어 생성
      auth/callback/route.ts  — Google OAuth 코드 → 세션 교환
      login/page.tsx          — Google 로그인 진입점
      signup/page.tsx         — 로그인과 동일 (가입/로그인 통합)
    lib/supabase/
      client.ts               — 브라우저 Supabase 클라이언트
      server.ts               — 서버 Supabase 클라이언트
      types.ts                — DB 타입 정의
    middleware.ts             — 세션 갱신 + 인증 가드 (미로그인 → /login)
  supabase/
    migrations/
      20260622000000_init.sql — profiles, connected_accounts, onboarding_events 테이블
```

### 단일 파일 설계 이유 (onboarding/page.tsx)

온보딩 플로우는 상태가 선형으로 흐른다. URL 라우팅으로 나누면 "뒤로가기로 설문으로 돌아가기" 같은 UX 처리가 복잡해진다. React 상태 머신(`Step` 유니온 타입)으로 전체 흐름을 한 파일에 담아 검토와 수정이 쉽게 했다.

---

## 구현 내용

### 상태 머신

```typescript
type Step =
  | "survey"        // 설문 (진입점)
  | "sns-select"    // SNS 선택
  | "connecting"    // 연동 중 (로딩)
  | "connected"     // 연동 완료 → 다음 목적 화면 CTA
  | "persona"       // [1번] 페르소나 설정 (브랜드명·톤·타겟·금지어)
  | "analytics"     // [2번] 성과 분석 결과 (mock)
  | "content-type"  // 콘텐츠 형식 선택 (카드뉴스·숏폼·블로그)
  | "content-source"// [3번] 콘텐츠 기획받기 (소재 선택 + 주제 입력 + AI 생성)
  | "expand"        // 다른 플랫폼 확장 넛지
  | "ideas"         // [4번] 아이디어 발산 (Claude API 스트리밍)
  | "chat"          // [5번] 자유 대화 (Claude API 스트리밍)
  | "done";         // 완료
```

전환 로직:
```
survey →(1,2)→ sns-select → connecting → connected →(1)→ persona → done
                                                    →(2)→ analytics → done
survey →(3)→   content-source → ideas 생성 → sns-select → connecting → done
survey →(4)→   ideas → sns-select → connecting → done
```

※ 연동 이력 있는 경우: `sns-select → connecting → connected` 스텝 전체 건너뜀

### 인증 구조

```
Google OAuth → /auth/callback → Supabase 세션 → 쿠키 저장
middleware.ts → getUser() → 토큰 자동 갱신 → 세션 연장
```

- `@supabase/ssr`의 `createBrowserClient` + 미들웨어 패턴으로 세션을 쿠키에 유지
- 재방문 시 로그인 없이 온보딩 페이지 진입 가능

### Claude API 활용

| 기능 | 모델 | 방식 |
|------|------|------|
| 콘텐츠 아이디어 생성 (3·4번) | GPT-4o-mini (PoC) | SSE 스트리밍 |
| 자유 대화 (5번) | GPT-4o-mini (PoC) | SSE 스트리밍 |

> 프로덕션에서는 Claude Haiku로 교체 예정. API 응답 형식(SSE)은 동일하므로 모델명만 변경하면 된다.

### DB 구조 (Supabase)

```sql
profiles             -- 사용자 프로필, survey_choice, onboarding_completed_at
connected_accounts   -- 연동된 SNS 플랫폼 (platform, is_active, token_expires_at)
onboarding_events    -- 플로우 내 이벤트 로그 (event_name, properties JSONB)
```

RLS(Row Level Security) 적용 — 본인 데이터만 읽기/쓰기 가능.

---

## 검증 포인트

| 가설 | 검증 방법 |
|------|-----------|
| 설문 후 목적별로 다른 화면으로 분기되는가 | 4가지 선택지를 각각 클릭해서 플로우 확인 |
| 이미 연동한 사용자는 SNS 선택을 건너뛰는가 | `connected_accounts`에 레코드가 있는 상태에서 재진입 |
| 콘텐츠 아이디어가 실제로 생성되는가 | [3·4번] 주제 입력 후 Claude 스트리밍 응답 확인 |
| 페르소나 저장이 완료되는가 | [1번] 브랜드명 입력 후 저장 버튼 클릭 확인 |
| 세션이 재방문 시에도 유지되는가 | 로그인 후 브라우저 닫고 재접속 |

Vercel 배포 주소: **https://poc-three-blush.vercel.app/**

---

## 프로덕션 이식 경로

| 항목 | PoC 현재 상태 | 프로덕션 |
|------|-------------|----------|
| 인증 | Supabase Google OAuth (작동 중) | 기존 Mirra 인증 시스템으로 교체 |
| 연동 시뮬레이션 | `setTimeout(1.8초)` mock | 실제 OAuth flow (`/api/auth/[platform]`) |
| 성과 분석 | Mock 데이터 | 실제 SNS API 데이터 |
| LLM | GPT-4o-mini | Claude Haiku (API 형식 동일, 모델명 교체) |
| 이벤트 계측 | `onboarding_events` 테이블 기록 | PostHog 병행 연결 (B.md Day 4) |
| 온보딩 완료 플래그 | `profiles.onboarding_completed_at` 기록 (작동 중) | 동일 |
| SNS 중복 연동 방지 | `connected_accounts` 조회 후 스킵 (작동 중) | 동일 |

---

## AI 사용 회고

### 사용한 AI 도구 및 워크플로우

| 단계 | 도구 | 역할 |
|------|------|------|
| 1 | **Claude Code (대화)** | 온보딩 설문 방향 정의. 선택지별 다른 플로우를 만드는 것이 맞는지 논거 검토 |
| 2 | **Claude Code (구현)** | 상태 머신 구조, Supabase 인증 연결, API route 초안 생성 |
| 3 | **Claude Code (QA)** | 배포 후 버튼별 플로우 동작 확인, 콘솔 에러 점검 |

### AI를 사용한 부분

- **Supabase SSR 미들웨어 패턴**: `@supabase/ssr` 공식 권장 패턴으로 세션 갱신 로직 작성. 처음에 `response` 변수명이 남아 런타임 에러가 발생했고, Claude가 `supabaseResponse`로 일관되게 수정하는 것을 제안해 적용했다.
- **컴포넌트 보일러플레이트**: 각 Step 화면의 JSX 구조와 Tailwind 클래스는 Claude가 초안을 생성했다.
- **Claude API 스트리밍**: SSE 파싱 로직(`data: {...}` 라인 처리)을 Claude와 함께 작성했다.

### AI를 믿지 않고 직접 결정한 부분

- **선택지별 경로를 다르게 만든 결정**: Claude는 처음에 모든 경로를 "SNS 선택 → 첫 발행"으로 통일하는 것을 제안했다. [3번] 사용자가 아이디어를 먼저 받고 나서 어디에 올릴지 결정하는 순서가 더 자연스럽다는 판단으로 직접 분기했다.
- **[1번] 페르소나 설정을 SNS 연동 이후로 배치한 결정**: "어떤 계정의 브랜드인가"가 결정된 후에 페르소나를 입력받아야 의미가 있다. 연동 전 페르소나 입력은 맥락이 없다.
- **SNS 중복 연동 방지를 DB 기반으로 구현한 결정**: localStorage나 쿠키로 처리하는 방법도 있지만, `connected_accounts` 테이블이 이미 있으므로 DB를 단일 진실 소스(single source of truth)로 쓰는 것이 맞다.
- **mock 데이터와 실제 구현 사이의 범위 결정**: [2번] 성과 분석은 실제 SNS API 없이 mock으로 처리했다. PoC에서 증명하려는 것은 "연동 후 이런 인사이트를 보여줄 수 있다"는 UX 흐름이지, 실제 데이터 파이프라인이 아니다. 범위를 의도적으로 잘랐다.
