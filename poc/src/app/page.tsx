"use client";

import { useState } from "react";

// ── 타입 ────────────────────────────────────────────────────────────────────

type Step =
  | "survey"
  | "sns-select"
  | "connecting"
  | "connected"
  | "expand"
  | "ideas"
  | "ideas-result"
  | "chat";

type SurveyChoice = 1 | 2 | 3 | 4 | 5;
type Platform = "instagram" | "tiktok" | "kakao";

const SURVEY_OPTIONS: { id: SurveyChoice; label: string; sub: string; emoji: string }[] = [
  { id: 1, emoji: "🤖", label: "페르소나 생성으로 SNS를 자동화하고 싶어요", sub: "AI가 내 브랜드 톤으로 콘텐츠를 자동 생성" },
  { id: 2, emoji: "📈", label: "이미 있는 SNS 계정의 성과를 높이고 싶어요", sub: "참여율·노출·저장 지표를 데이터로 개선" },
  { id: 3, emoji: "✍️", label: "글을 한 번 원격으로 써보고 싶어요", sub: "AI 초안을 받아 빠르게 발행까지" },
  { id: 4, emoji: "💡", label: "글을 쓸 아이디어가 없어서 활용해보고 싶어요", sub: "콘텐츠 아이디어 발산부터 시작" },
  { id: 5, emoji: "💬", label: "다른 생각이 있어요", sub: "직접 말씀해주시면 맞춤 안내드릴게요" },
];

const PLATFORMS: { id: Platform; label: string; emoji: string; color: string }[] = [
  { id: "instagram", label: "인스타그램", emoji: "📸", color: "from-purple-500 to-pink-500" },
  { id: "tiktok",    label: "틱톡",       emoji: "🎵", color: "from-gray-900 to-gray-700" },
  { id: "kakao",     label: "카카오채널",  emoji: "💬", color: "from-yellow-400 to-yellow-300" },
];

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "인스타그램",
  tiktok: "틱톡",
  kakao: "카카오채널",
};

// ── 유틸 ────────────────────────────────────────────────────────────────────

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

// ── 화면 컴포넌트 ────────────────────────────────────────────────────────────

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

function SnsSelectScreen({
  choice,
  onSelect,
  onBack,
}: {
  choice: SurveyChoice;
  onSelect: (p: Platform) => void;
  onBack: () => void;
}) {
  const label =
    choice === 1 ? "자동화할" :
    choice === 2 ? "성과를 높일" :
    "글을 발행할";

  return (
    <div>
      <Progress current={2} total={4} />
      <BackButton onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{label} SNS를 선택해주세요</h1>
      <p className="text-sm text-gray-500 mb-6">계정을 연동하면 발행·성과 분석·자동화가 활성화됩니다</p>
      <div className="grid grid-cols-3 gap-3">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl`}>
              {p.emoji}
            </div>
            <span className="text-sm font-medium text-gray-800">{p.label}</span>
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
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 animate-pulse">
        <span className="text-3xl">{PLATFORMS.find(p => p.id === platform)?.emoji}</span>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{PLATFORM_LABEL[platform]} 연동 중...</h2>
      <p className="text-sm text-gray-400">OAuth 인증 창이 열렸습니다. 로그인 후 권한을 허용해주세요.</p>
    </div>
  );
}

function ConnectedScreen({
  platform,
  onPublish,
}: {
  platform: Platform;
  onPublish: () => void;
}) {
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
          <button
            key={p.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-blue-400 transition-all text-sm"
          >
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center`}>
              {p.emoji}
            </div>
            <span className="font-medium text-gray-800">{p.label}에도 올리기</span>
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

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
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
          onClick={onPublish}
          className="w-full py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
        >
          예약 발행 기능 사용해보기 →
        </button>
      </div>
    </div>
  );
}

function ChatScreen({ onBack, onConnect }: { onBack: () => void; onConnect: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "어떤 걸 원하시는지 말씀해주세요. 목적에 맞게 Mirra를 안내해드릴게요 😊" },
  ]);
  const [replied, setReplied] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user" as const, text: input }];
    setInput("");
    setMessages(newMessages);
    setTimeout(() => {
      setMessages(m => [...m, {
        role: "ai",
        text: "말씀해주신 내용을 바탕으로, SNS 계정을 연동하고 첫 콘텐츠를 만들어보시는 게 가장 빠른 시작일 것 같아요. 어떤 채널부터 시작해볼까요?",
      }]);
      setReplied(true);
    }, 900);
  };

  return (
    <div>
      <Progress current={2} total={4} />
      <BackButton onClick={onBack} />
      <h1 className="text-xl font-bold text-gray-900 mb-4">어떤 게 필요하신가요?</h1>
      <div className="space-y-3 mb-4 min-h-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
              m.role === "user"
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-800 rounded-bl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      {replied ? (
        <button
          onClick={onConnect}
          className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors mb-3"
        >
          SNS 연동하러 가기 →
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{ color: "#000" }}
            placeholder="자유롭게 입력해주세요..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-500 disabled:opacity-40 transition-colors"
          >
            전송
          </button>
        </div>
      )}
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

// ── 메인 ────────────────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const [step, setStep] = useState<Step>("survey");
  const [choice, setChoice] = useState<SurveyChoice | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);

  const handleSurvey = (c: SurveyChoice) => {
    setChoice(c);
    if (c === 4) setStep("ideas");
    else if (c === 5) setStep("chat");
    else setStep("sns-select");
  };

  const handlePlatformSelect = (p: Platform) => {
    setPlatform(p);
    setStep("connecting");
    setTimeout(() => setStep("connected"), 1800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* 로고 */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-gray-800">Mirra</span>
        </div>

        {step === "survey" && <SurveyScreen onSelect={handleSurvey} />}

        {step === "sns-select" && choice && (
          <SnsSelectScreen
            choice={choice}
            onSelect={handlePlatformSelect}
            onBack={() => setStep("survey")}
          />
        )}

        {step === "connecting" && platform && <ConnectingScreen platform={platform} />}

        {step === "connected" && platform && (
          <ConnectedScreen platform={platform} onPublish={() => setStep("expand")} />
        )}

        {step === "expand" && platform && (
          <ExpandScreen platform={platform} onDone={() => setStep("done" as Step)} />
        )}

        {step === "ideas" && (
          <IdeasScreen
            onDone={() => setStep("sns-select")}
            onBack={() => setStep("survey")}
          />
        )}

        {step === "chat" && (
          <ChatScreen
            onBack={() => setStep("survey")}
            onConnect={() => setStep("sns-select")}
          />
        )}

        {(step as string) === "done" && <DoneScreen />}
      </div>
    </div>
  );
}
