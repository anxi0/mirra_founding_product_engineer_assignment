# Mirra FPE 채용 과제

## 문서 구성

| 파일 | 내용 |
|------|------|
| [A.md](A.md) | **세 전선에 대한 관점** — 가(기술부채)·나(Agent-first)·다(플라이휠) 각각에 대한 구조적 분석 |
| [B.md](B.md) | **레버리지 선택과 첫 1주 계획** — 가(부채 리팩토링)를 선택한 이유, Day 단위 실행 계획, 측정 지표 |
| [C.md](C.md) | **작동하는 PoC** — 온보딩 설문 플로우 구현, 설계 근거, 검증 포인트, AI 사용 회고 |

## PoC 데모

**https://poc-three-blush.vercel.app/**

Google 계정으로 로그인하면 온보딩 플로우를 직접 체험할 수 있습니다.

```
가입 (Google OAuth)
 └→ 설문 (4지선다)
      ├→ [1] 페르소나로 SNS 자동화   → SNS 선택 → 연동 → 페르소나 설정
      ├→ [2] 기존 SNS 성과 향상      → SNS 선택 → 연동 → 성과 분석 결과
      ├→ [3] 글 한 번 원격으로 써보기 → 콘텐츠 기획받기 → 아이디어 생성 → SNS 선택
      └→ [4] 아이디어가 없어서        → 아이디어 발산 → SNS 선택
```

## 로컬 실행

```bash
cd poc
npm install
npm run dev  # http://localhost:3000
```

`.env.local` 필요:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
