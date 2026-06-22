"use client";

import React, { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Platform, OnboardingEventName } from "@/lib/supabase/types";

// ── 타입 ────────────────────────────────────────────────────────────────────

type Step =
  | "survey"
  | "sns-select"
  | "connecting"
  | "connected"
  | "content-type"
  | "content-source"
  | "expand"
  | "ideas"
  | "ideas-result"
  | "chat"
  | "done";

type SurveyChoice = 1 | 2 | 3 | 4 | 5;

const SURVEY_OPTIONS: { id: SurveyChoice; label: string; sub: string; emoji: string }[] = [
  { id: 1, emoji: "🤖", label: "페르소나 생성으로 SNS를 자동화하고 싶어요", sub: "AI가 내 브랜드 톤으로 콘텐츠를 자동 생성" },
  { id: 2, emoji: "📈", label: "이미 있는 SNS 계정의 성과를 높이고 싶어요", sub: "참여율·노출·저장 지표를 데이터로 개선" },
  { id: 3, emoji: "✍️", label: "글을 한 번 원격으로 써보고 싶어요", sub: "AI 초안을 받아 빠르게 발행까지" },
  { id: 4, emoji: "💡", label: "글을 쓸 아이디어가 없어서 활용해보고 싶어요", sub: "콘텐츠 아이디어 발산부터 시작" },
  { id: 5, emoji: "💬", label: "다른 생각이 있어요", sub: "직접 말씀해주시면 맞춤 안내드릴게요" },
];

const PLATFORMS: { id: Platform; label: string; color: string; icon: React.ReactNode }[] = [
  {
    id: "instagram", label: "인스타그램",
    color: "from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]",
    icon: <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>,
  },
  {
    id: "tiktok", label: "틱톡",
    color: "from-gray-950 to-gray-800",
    icon: <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  },
  {
    id: "youtube", label: "유튜브",
    color: "from-red-600 to-red-500",
    icon: <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  },
  {
    id: "threads", label: "쓰레드",
    color: "from-gray-900 to-gray-700",
    icon: <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/></svg>,
  },
];

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "인스타그램",
  tiktok: "틱톡",
  youtube: "유튜브",
  threads: "쓰레드",
};

// ── Supabase 이벤트 헬퍼 ─────────────────────────────────────────────────────

async function trackEvent(
  event_name: OnboardingEventName,
  properties?: Record<string, unknown>
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("onboarding_events").insert({ user_id: user.id, event_name, properties: properties ?? null });
}

async function saveSurveyChoice(choice: SurveyChoice) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("profiles").update({ survey_choice: choice }).eq("id", user.id);
}

async function saveConnectedAccount(platform: Platform) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("connected_accounts").upsert({ user_id: user.id, platform, is_active: true });
}

async function completeOnboarding() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
}

// ── 공통 컴포넌트 ─────────────────────────────────────────────────────────────

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full mb-8">
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-500"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
      ← 뒤로
    </button>
  );
}

// ── 화면 컴포넌트 ─────────────────────────────────────────────────────────────

function SurveyScreen({ onSelect }: { onSelect: (c: SurveyChoice) => void }) {
  const [hovered, setHovered] = useState<SurveyChoice | null>(null);
  return (
    <div>
      <Progress current={1} total={4} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mirra에서 무엇을 하고 싶으세요?</h1>
      <p className="text-sm text-gray-500 mb-6">목적에 맞는 시작 경로를 안내해드릴게요</p>
      <div className="space-y-3">
        {SURVEY_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            onMouseEnter={() => setHovered(opt.id)}
            onMouseLeave={() => setHovered(null)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150
              ${hovered === opt.id ? "border-blue-400 bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <span className="text-2xl w-8 shrink-0">{opt.emoji}</span>
            <div>
              <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{opt.sub}</div>
            </div>
            <span className="ml-auto text-gray-300">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SnsSelectScreen({ choice, onSelect, onBack }: { choice: SurveyChoice; onSelect: (p: Platform) => void; onBack: () => void }) {
  const label = choice === 1 ? "자동화할" : choice === 2 ? "성과를 높일" : "글을 발행할";
  return (
    <div>
      <Progress current={2} total={4} />
      <BackButton onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{label} SNS를 선택해주세요</h1>
      <p className="text-sm text-gray-500 mb-6">계정을 연동하면 발행·성과 분석·자동화가 활성화됩니다</p>
      <div className="grid grid-cols-2 gap-3">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br ${p.color} hover:opacity-90 hover:shadow-md transition-all`}
          >
            {p.icon}
            <span className="text-sm font-semibold text-white">{p.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center mt-4">연동은 30초면 됩니다. 언제든 추가·해제할 수 있어요.</p>
    </div>
  );
}

function ConnectingScreen({ platform }: { platform: Platform }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Progress current={3} total={4} />
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${PLATFORMS.find(p => p.id === platform)?.color} flex items-center justify-center mb-4 animate-pulse [&_svg]:w-8 [&_svg]:h-8`}>
        {PLATFORMS.find(p => p.id === platform)?.icon}
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{PLATFORM_LABEL[platform]} 연동 중...</h2>
      <p className="text-sm text-gray-400">OAuth 인증 창이 열렸습니다. 로그인 후 권한을 허용해주세요.</p>
    </div>
  );
}

function ConnectedScreen({ platform, onPublish }: { platform: Platform; onPublish: () => void }) {
  return (
    <div>
      <Progress current={3} total={4} />
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{PLATFORM_LABEL[platform]} 연동 완료!</h2>
        <p className="text-sm text-gray-500 mt-1">이제 Mirra에서 바로 발행할 수 있어요</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
        <div className="font-medium text-gray-800 mb-2">첫 번째 콘텐츠 만들기</div>
        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2"><span className="text-blue-500">●</span> 주제를 입력하면 AI가 초안을 만들어드립니다</div>
          <div className="flex items-center gap-2"><span className="text-gray-300">●</span> 수정 후 지금 바로 발행하거나 예약할 수 있어요</div>
        </div>
      </div>
      <button
        onClick={onPublish}
        className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors"
      >
        첫 콘텐츠 만들고 발행하기 →
      </button>
    </div>
  );
}

type SourceType = "original" | "web" | "internal";
type ContentType = "card" | "short" | "blog";

const PLATFORM_CONTENT_TYPES: Record<Platform, ContentType[]> = {
  instagram: ["card", "short"],
  tiktok:    ["short"],
  threads:   ["blog"],
  youtube:   ["short"],
};

const CONTENT_TYPE_META: Record<ContentType, { label: string; sub: string; icon: React.ReactNode }> = {
  card: {
    label: "카드뉴스",
    sub: "이미지 슬라이드",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><rect x="2" y="3" width="20" height="14" rx="2"/><path strokeLinecap="round" d="M8 21h8M12 17v4"/></svg>,
  },
  short: {
    label: "숏폼",
    sub: "15~60초 세로 영상",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"/></svg>,
  },
  blog: {
    label: "블로그 · 글",
    sub: "텍스트 중심 긴 글",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>,
  },
};

const SOURCE_OPTIONS: { id: SourceType; label: string; sub: string; icon: React.ReactNode }[] = [
  {
    id: "original", label: "자체 창작", sub: "브랜드 관점으로 직접 기획",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>,
  },
  {
    id: "web", label: "웹 검색", sub: "트렌드·검색어 기반 아이디어",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35"/></svg>,
  },
  {
    id: "internal", label: "내 자료 탐색", sub: "내 경험·데이터에서 발굴",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.442 2.798H4.24c-1.47 0-2.441-1.798-1.442-2.798L4.2 15.3"/></svg>,
  },
];

type IdeaCard = { title: string; desc: string };

function parseIdeas(raw: string): IdeaCard[] {
  return raw
    .split("---")
    .map(block => {
      const titleMatch = block.match(/제목[:：]\s*(.+)/);
      const descMatch = block.match(/설명[:：]\s*([\s\S]+?)(?=제목|$)/);
      return {
        title: titleMatch?.[1]?.trim() ?? "",
        desc: descMatch?.[1]?.trim() ?? "",
      };
    })
    .filter(c => c.title);
}

function ContentTypeScreen({
  platform,
  onSelect,
  onBack,
}: {
  platform: Platform;
  onSelect: (t: ContentType) => void;
  onBack: () => void;
}) {
  const types = PLATFORM_CONTENT_TYPES[platform];
  return (
    <div>
      <Progress current={4} total={5} />
      <BackButton onClick={onBack} />
      <h1 className="text-xl font-bold text-gray-900 mb-1">뭘 만들어볼까요?</h1>
      <p className="text-sm text-gray-500 mb-6">
        {PLATFORM_LABEL[platform]}에서 지원하는 콘텐츠 유형이에요
      </p>
      <div className="space-y-3">
        {types.map(type => {
          const meta = CONTENT_TYPE_META[type];
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition-colors shrink-0">
                {meta.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{meta.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{meta.sub}</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 ml-auto text-gray-300 group-hover:text-blue-400 transition-colors shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContentSourceScreen({
  platform,
  contentType,
  onDone,
  onBack,
}: {
  platform: Platform;
  contentType: ContentType;
  onDone: () => void;
  onBack: () => void;
}) {
  const [source, setSource] = useState<SourceType>("original");
  const [topic, setTopic] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [raw, setRaw] = useState("");
  const [ideas, setIdeas] = useState<IdeaCard[]>([]);
  const [done, setDone] = useState(false);

  const placeholders: Record<SourceType, string> = {
    original: "예) 카페 창업 스토리, 피부 관리 루틴, 헬스 홈트레이닝...",
    web: "예) 2025 인스타그램 트렌드, 소자본 창업, 비건 디저트...",
    internal: "예) 최근 방문 고객 후기, 매장 리뉴얼 과정, 직원 비하인드...",
  };

  const handleGenerate = async () => {
    if (!topic.trim() || streaming) return;
    setStreaming(true);
    setRaw("");
    setIdeas([]);
    setDone(false);
    await trackEvent("ideas_generated", { source, topic, platform });

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, topic, platform, contentType }),
      });
      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setRaw(accumulated);
            }
          } catch { /* skip */ }
        }
      }
      setIdeas(parseIdeas(accumulated));
      setDone(true);
    } catch {
      setRaw("오류가 발생했어요. 다시 시도해주세요.");
      setDone(true);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div>
      <Progress current={4} total={5} />
      <BackButton onClick={onBack} />
      <h1 className="text-xl font-bold text-gray-900 mb-1">콘텐츠 기획받기</h1>
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
          {CONTENT_TYPE_META[contentType].icon}
          {CONTENT_TYPE_META[contentType].label}
        </span>
        <span className="text-xs text-gray-400">{PLATFORM_LABEL[platform]}</span>
      </div>

      <p className="text-xs font-semibold text-gray-500 mb-2">어디서 소재를 찾아볼까요?</p>
      {/* 소재 선택 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {SOURCE_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSource(opt.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
              source === opt.id
                ? "border-purple-400 bg-purple-50 text-purple-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
          >
            {opt.icon}
            <span className="text-xs font-semibold leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* 주제 입력 */}
      {!done && (
        <>
          <textarea
            className="w-full border border-gray-200 rounded-xl p-3.5 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-400 mb-3"
            style={{ color: "#000" }}
            placeholder={placeholders[source]}
            rows={3}
            value={topic}
            onChange={e => setTopic(e.target.value)}
            disabled={streaming}
          />
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || streaming}
            className="w-full py-3 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-500 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {streaming ? (
              <><span className="animate-spin">✦</span> 콘텐츠 기획 중...</>
            ) : (
              "✦ 콘텐츠 추천받기"
            )}
          </button>
        </>
      )}

      {/* 스트리밍 중 raw 텍스트 미리보기 */}
      {streaming && raw && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 whitespace-pre-wrap max-h-40 overflow-y-auto">
          {raw}
          <span className="animate-pulse">▋</span>
        </div>
      )}

      {/* 결과 카드 */}
      {done && ideas.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700 mb-2">아이디어 {ideas.length}개 생성 완료!</p>
          {ideas.map((idea, i) => (
            <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-purple-500 font-bold text-xs w-4 shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 leading-snug mb-0.5">{idea.title}</div>
                {idea.desc && <div className="text-xs text-gray-500 leading-snug">{idea.desc}</div>}
              </div>
            </div>
          ))}
          <button
            onClick={onDone}
            className="w-full mt-3 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors"
          >
            이 아이디어로 발행하러 가기 →
          </button>
          <button
            onClick={() => { setDone(false); setRaw(""); setIdeas([]); }}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            다시 생성하기
          </button>
        </div>
      )}

      {/* raw fallback (파싱 실패 시) */}
      {done && ideas.length === 0 && raw && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap">
          {raw}
          <button onClick={onDone} className="mt-3 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors">
            발행하러 가기 →
          </button>
        </div>
      )}
    </div>
  );
}

function ExpandScreen({ platform, onDone }: { platform: Platform; onDone: () => void }) {
  const others = PLATFORMS.filter(p => p.id !== platform);
  return (
    <div>
      <Progress current={4} total={4} />
      <div className="flex flex-col items-center text-center mb-6">
        <div className="text-3xl mb-3">🎉</div>
        <h2 className="text-xl font-bold text-gray-900">첫 발행 완료!</h2>
        <p className="text-sm text-gray-500 mt-1">{PLATFORM_LABEL[platform]}에 성공적으로 올라갔어요</p>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
        <div className="text-sm font-semibold text-blue-800 mb-1">같은 콘텐츠, 더 많은 채널로</div>
        <p className="text-xs text-blue-600">방금 만든 콘텐츠를 다른 SNS에 맞게 자동 변환해드릴게요. 한 번 더 올리는 데 30초면 됩니다.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {others.map(p => (
          <button key={p.id} className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br ${p.color} hover:opacity-90 transition-all text-sm`}>
            <div className="w-6 h-6 flex items-center justify-center shrink-0 [&_svg]:w-5 [&_svg]:h-5">{p.icon}</div>
            <span className="font-medium text-white text-xs">{p.label}에도 올리기</span>
          </button>
        ))}
      </div>
      <button onClick={onDone} className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        나중에 할게요 →
      </button>
    </div>
  );
}

function IdeasScreen({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    await trackEvent("ideas_generated", { topic });
    setTimeout(() => { setGenerating(false); setDone(true); }, 1800);
  };

  if (done) return <IdeasResultScreen onPublish={onDone} />;

  return (
    <div>
      <Progress current={2} total={4} />
      <BackButton onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">어떤 주제로 시작할까요?</h1>
      <p className="text-sm text-gray-500 mb-6">키워드나 업종을 입력하면 콘텐츠 아이디어를 10개 드릴게요</p>
      <textarea
        className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        style={{ color: "#000" }}
        placeholder="예) 소자본 카페 창업, 피부과 시술 후기, 헬스 홈트레이닝..."
        rows={3}
        value={topic}
        onChange={e => setTopic(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        disabled={!topic.trim() || generating}
        className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 disabled:opacity-40 transition-colors"
      >
        {generating ? "아이디어 생성 중..." : "아이디어 10개 만들어줘 →"}
      </button>
    </div>
  );
}

function IdeasResultScreen({ onPublish }: { onPublish: () => void }) {
  const ideas = [
    "창업 초기 3개월, 내가 몰랐던 것들",
    "단골 만드는 SNS 글쓰기 비법 5가지",
    "작은 가게도 할 수 있는 콘텐츠 마케팅",
    "고객 후기가 광고보다 강한 이유",
    "주 1회 SNS, 3개월 만에 팔로워 1000명",
  ];
  const handleCta = async () => {
    await trackEvent("schedule_cta_clicked");
    onPublish();
  };
  return (
    <div>
      <Progress current={3} total={4} />
      <h2 className="text-xl font-bold text-gray-900 mb-1">아이디어 생성 완료!</h2>
      <p className="text-sm text-gray-500 mb-4">마음에 드는 주제로 콘텐츠를 만들어보세요</p>
      <div className="space-y-2 mb-6">
        {ideas.map((idea, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
            <span className="text-blue-400 font-bold text-xs w-4">{i + 1}</span>
            <span className="text-gray-800">{idea}</span>
            <button className="ml-auto text-xs text-blue-500 hover:text-blue-700 shrink-0">선택 →</button>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="text-sm font-semibold text-amber-800 mb-1">✨ 글 만들고 바로 발행해볼까요?</div>
        <p className="text-xs text-amber-700 mb-3">SNS 계정을 연동하면 콘텐츠를 만들자마자 바로 예약 발행할 수 있어요.</p>
        <button
          onClick={handleCta}
          className="w-full py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
        >
          예약 발행 기능 사용해보기 →
        </button>
      </div>
    </div>
  );
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function ChatScreen({ onBack, onConnect }: { onBack: () => void; onConnect: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const GREETING = "어떤 걸 원하시는지 말씀해주세요. 목적에 맞게 Mirra를 안내해드릴게요.";

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error("API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      setMessages(m => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (delta) {
              aiText += delta;
              setMessages(m => [
                ...m.slice(0, -1),
                { role: "assistant", content: aiText },
              ]);
              scrollToBottom();
            }
          } catch { /* skip malformed */ }
        }
      }

      setShowCta(true);
    } catch {
      setMessages(m => [...m.slice(0, -1), { role: "assistant", content: "오류가 발생했어요. 다시 시도해주세요." }]);
    } finally {
      setStreaming(false);
      scrollToBottom();
    }
  };

  const allMessages = [
    { role: "assistant" as const, content: GREETING },
    ...messages,
  ];

  return (
    <div>
      <Progress current={2} total={4} />
      <BackButton onClick={onBack} />
      <h1 className="text-xl font-bold text-gray-900 mb-4">어떤 게 필요하신가요?</h1>
      <div className="space-y-3 mb-4 min-h-32 max-h-72 overflow-y-auto pr-1">
        {allMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
              m.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
            }`}>
              {m.content || <span className="opacity-40">▋</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {showCta && (
        <button onClick={onConnect} className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors mb-3">
          SNS 연동하러 가기 →
        </button>
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          style={{ color: "#000" }}
          placeholder="자유롭게 입력해주세요..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          disabled={streaming}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || streaming}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-500 disabled:opacity-40 transition-colors"
        >
          {streaming ? "…" : "전송"}
        </button>
      </div>
    </div>
  );
}

function DoneScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4">🚀</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Mirra 시작 완료!</h2>
      <p className="text-sm text-gray-500">이제 대시보드에서 모든 기능을 사용할 수 있어요.</p>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("survey");
  const [choice, setChoice] = useState<SurveyChoice | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);

  const handleSurvey = useCallback(async (c: SurveyChoice) => {
    setChoice(c);
    await saveSurveyChoice(c);
    await trackEvent("survey_completed", { choice: c });
    if (c === 4) setStep("ideas");
    else if (c === 5) setStep("chat");
    else setStep("sns-select");
  }, []);

  const handlePlatformSelect = useCallback(async (p: Platform) => {
    setPlatform(p);
    await trackEvent("platform_selected", { platform: p });
    setStep("connecting");
    setTimeout(async () => {
      await saveConnectedAccount(p);
      await trackEvent("account_connected", { platform: p });
      setStep("connected");
    }, 1800);
  }, []);

  const handlePublish = useCallback(async (p: Platform) => {
    await trackEvent("first_publish_clicked", { platform: p });
    const types = PLATFORM_CONTENT_TYPES[p];
    if (types.length > 1) {
      setStep("content-type");
    } else {
      setContentType(types[0]);
      setStep("content-source");
    }
  }, []);

  const handleContentTypeSelect = useCallback((t: ContentType) => {
    setContentType(t);
    setStep("content-source");
  }, []);

  const handleDone = useCallback(async () => {
    await completeOnboarding();
    setStep("done");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <img src="https://www.mirra.my/images/logos/mirr-logo-20260401.svg" alt="Mirra" className="h-7" />
        </div>

        {step === "survey" && <SurveyScreen onSelect={handleSurvey} />}

        {step === "sns-select" && choice && (
          <SnsSelectScreen choice={choice} onSelect={handlePlatformSelect} onBack={() => setStep("survey")} />
        )}

        {step === "connecting" && platform && <ConnectingScreen platform={platform} />}

        {step === "connected" && platform && (
          <ConnectedScreen platform={platform} onPublish={() => handlePublish(platform)} />
        )}

        {step === "content-type" && platform && (
          <ContentTypeScreen
            platform={platform}
            onSelect={handleContentTypeSelect}
            onBack={() => setStep("connected")}
          />
        )}

        {step === "content-source" && platform && contentType && (
          <ContentSourceScreen
            platform={platform}
            contentType={contentType}
            onDone={async () => {
              await trackEvent("expand_nudge_shown", { from_platform: platform });
              setStep("expand");
            }}
            onBack={() => {
              const types = PLATFORM_CONTENT_TYPES[platform];
              setStep(types.length > 1 ? "content-type" : "connected");
            }}
          />
        )}

        {step === "expand" && platform && (
          <ExpandScreen platform={platform} onDone={handleDone} />
        )}

        {step === "ideas" && (
          <IdeasScreen onDone={() => setStep("sns-select")} onBack={() => setStep("survey")} />
        )}

        {step === "chat" && (
          <ChatScreen onBack={() => setStep("survey")} onConnect={() => setStep("sns-select")} />
        )}

        {step === "done" && <DoneScreen />}
      </div>
    </div>
  );
}
