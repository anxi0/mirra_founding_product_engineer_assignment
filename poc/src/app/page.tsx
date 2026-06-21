"use client";

import { useState, useCallback } from "react";

type Counts = {
  ideas: number; generations: number; posts: number; analytics: number;
  cpm: number; cpm_linked: number; agent_queries: number;
};

type Loop1Row = { source_type: string; post_count: number; avg_engagement_pct: number; avg_impressions: number; avg_ctr_pct: number };
type Loop2Row = { platform: string; post_count: number; avg_engagement_pct: number; avg_impressions: number; total_likes: number; total_saves: number };
type Loop3Row = { intent_type: string; target_platform: string | null; content_format: string | null; query_count: number; accepted_count: number; avg_engagement_pct: number | null; avg_edits: number };

type AnalyticsData = { loop1: Loop1Row[]; loop2: Loop2Row[]; loop3: Loop3Row[]; counts: Counts };
type AgentQueryRow = { id: string; raw_query: string; intent_type: string; target_platform: string | null; content_format: string | null; resolved_action: string | null; created_at: string };

const PLATFORM_EMOJI: Record<string, string> = { instagram: "📸", tiktok: "🎵", kakao: "💬" };
const INTENT_COLOR: Record<string, string> = {
  create: "bg-blue-100 text-blue-700",
  schedule: "bg-purple-100 text-purple-700",
  analyze: "bg-green-100 text-green-700",
  edit: "bg-yellow-100 text-yellow-700",
  ask: "bg-gray-100 text-gray-600",
};

function Badge({ label, className }: { label: string; className?: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className ?? "bg-gray-100 text-gray-600"}`}>{label}</span>;
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function EngBar({ pct }: { pct: number }) {
  const w = Math.min(100, (pct / 15) * 100);
  const color = pct >= 10 ? "bg-emerald-400" : pct >= 7 ? "bg-amber-400" : "bg-red-300";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-sm font-medium">{pct}%</span>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [queries, setQueries] = useState<AgentQueryRow[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p.slice(0, 9)]);

  const fetchAnalytics = useCallback(async () => {
    const res = await fetch("/api/analytics");
    const json = await res.json();
    setData(json);
    const res2 = await fetch("/api/agent-query");
    setQueries(await res2.json());
  }, []);

  const handleSeed = async () => {
    setLoading("seed");
    const res = await fetch("/api/seed", { method: "POST" });
    const json = await res.json();
    addLog(`시드 완료 — ideas:${json.counts.contentIdeas} gen:${json.counts.carouselGenerations} posts:${json.counts.scheduledPosts} | cpm:${json.contentPerformanceMap}개 (백필 전)`);
    await fetchAnalytics();
    setLoading(null);
  };

  const handleBackfill = async () => {
    setLoading("backfill");
    const res = await fetch("/api/backfill", { method: "POST" });
    const json = await res.json();
    addLog(`백필 완료 — content_performance_map: ${json.before} → ${json.after}개`);
    await fetchAnalytics();
    setLoading(null);
  };

  const handleQuery = async () => {
    if (!queryInput.trim()) return;
    setLoading("query");
    const res = await fetch("/api/agent-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: queryInput }),
    });
    const json = await res.json();
    addLog(`쿼리 분류 — intent:${json.intentType} platform:${json.targetPlatform ?? "-"} format:${json.contentFormat ?? "-"} action:${json.resolvedAction ?? "-"}`);
    setQueryInput("");
    await fetchAnalytics();
    setLoading(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mirra 플라이휠 PoC</h1>
        <p className="text-sm text-gray-500 mt-1">기획 → 생성 → 발행 → 성과 4-hop 연결 데이터 파이프라인</p>
      </div>

      {/* 컨트롤 */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={handleSeed}
          disabled={!!loading}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {loading === "seed" ? "로딩..." : "1. 시드 데이터 삽입"}
        </button>
        <button
          onClick={handleBackfill}
          disabled={!!loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-40 transition-colors"
        >
          {loading === "backfill" ? "로딩..." : "2. 백필 실행 (4-hop 연결)"}
        </button>
        <button
          onClick={fetchAnalytics}
          disabled={!!loading}
          className="px-4 py-2 bg-white border border-gray-300 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 상태 카드 */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="content_ideas" value={data.counts.ideas} />
          <StatCard label="carousel_generations" value={data.counts.generations} />
          <StatCard label="scheduled_posts" value={data.counts.posts} />
          <StatCard label="post_analytics" value={data.counts.analytics} />
          <StatCard
            label="content_performance_map"
            value={data.counts.cpm}
            sub={data.counts.cpm === 0 ? "⚠ 백필 전 — 분석 불가" : `기획 연결 ${data.counts.cpm_linked}개 / 미연결 ${data.counts.cpm - data.counts.cpm_linked}개`}
          />
          <StatCard label="agent_queries" value={data.counts.agent_queries} />
        </div>
      )}

      {/* Agent 쿼리 입력 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">Agent 쿼리 입력 (인텐트 분류 테스트)</div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#333]"
            placeholder="예) 인스타그램에 이번주 카드뉴스 만들어줘"
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuery()}
          />
          <button
            onClick={handleQuery}
            disabled={!!loading || !queryInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-40 transition-colors"
          >
            분류
          </button>
        </div>

        {queries.length > 0 && (
          <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
            {queries.map(q => (
              <div key={q.id} className="flex items-center gap-2 text-xs text-gray-600">
                <Badge label={q.intent_type} className={INTENT_COLOR[q.intent_type]} />
                {q.target_platform && <Badge label={`${PLATFORM_EMOJI[q.target_platform] ?? ""} ${q.target_platform}`} />}
                {q.content_format && <Badge label={q.content_format} />}
                <span className="text-gray-500 truncate">{q.raw_query}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 분석 루프 */}
      {data && data.counts.cpm > 0 && (
        <div className="space-y-4">
          {/* 루프 1 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="font-semibold text-gray-800 mb-1">루프 1 — 기획 소스 유형별 참여율</div>
            <div className="text-xs text-gray-400 mb-3">어떤 기획 방식이 더 높은 성과로 이어지는가 (Agent 제안 근거)</div>
            <div className="space-y-2">
              {data.loop1.map(r => (
                <div key={r.source_type} className="flex items-center gap-3">
                  <div className="w-36 text-sm text-gray-700 shrink-0">{r.source_type}</div>
                  <EngBar pct={r.avg_engagement_pct} />
                  <div className="text-xs text-gray-400 ml-auto">{Number(r.avg_impressions).toLocaleString()} 노출 · CTR {r.avg_ctr_pct}%</div>
                  <Badge label={`${r.post_count}개`} />
                </div>
              ))}
            </div>
            {data.loop1.length >= 2 && (
              <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                💡 &quot;{data.loop1[0].source_type}&quot; 기반 콘텐츠가 &quot;{data.loop1[data.loop1.length - 1].source_type}&quot;보다 참여율{" "}
                {(data.loop1[0].avg_engagement_pct / data.loop1[data.loop1.length - 1].avg_engagement_pct).toFixed(1)}배 높음
              </div>
            )}
          </div>

          {/* 루프 2 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="font-semibold text-gray-800 mb-1">루프 2 — 플랫폼별 성과</div>
            <div className="text-xs text-gray-400 mb-3">수평 배포(기획 1개 → 여러 SNS) 우선순위 결정</div>
            <div className="space-y-2">
              {data.loop2.map(r => (
                <div key={r.platform} className="flex items-center gap-3">
                  <div className="w-36 text-sm text-gray-700 shrink-0">
                    {PLATFORM_EMOJI[r.platform] ?? ""} {r.platform}
                  </div>
                  <EngBar pct={r.avg_engagement_pct} />
                  <div className="text-xs text-gray-400 ml-auto">
                    ♥ {Number(r.total_likes).toLocaleString()} · 🔖 {Number(r.total_saves).toLocaleString()}
                  </div>
                  <Badge label={`${r.post_count}개`} />
                </div>
              ))}
            </div>
          </div>

          {/* 루프 3 */}
          {data.loop3.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-semibold text-gray-800 mb-1">루프 3 — Agent 쿼리 인텐트별 성과</div>
              <div className="text-xs text-gray-400 mb-3">어떤 요청 패턴이 좋은 콘텐츠로 이어지는가</div>
              <div className="space-y-2">
                {data.loop3.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge label={r.intent_type} className={INTENT_COLOR[r.intent_type]} />
                    {r.target_platform && <Badge label={`${PLATFORM_EMOJI[r.target_platform] ?? ""} ${r.target_platform}`} />}
                    {r.content_format && <Badge label={r.content_format} />}
                    <span className="text-gray-400 text-xs ml-auto">{r.query_count}건</span>
                    {r.avg_engagement_pct != null
                      ? <EngBar pct={r.avg_engagement_pct} />
                      : <span className="text-xs text-gray-300">성과 데이터 없음</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data && data.counts.cpm === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ⚠ content_performance_map이 비어있습니다. &quot;2. 백필 실행&quot; 버튼을 눌러 4-hop을 연결하세요.
        </div>
      )}

      {/* 로그 */}
      {log.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </main>
  );
}
