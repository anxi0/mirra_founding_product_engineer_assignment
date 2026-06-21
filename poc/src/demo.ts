import { db, initTables } from "./db.ts";
import { agentQueries, contentPerformanceMap } from "./schema.ts";
import { seed } from "./seed.ts";
import { backfill } from "./backfill.ts";
import { classify } from "./intent-classifier.ts";
import { loop1_ideaSourcePerformance, loop2_platformPerformance, loop3_agentQueryPerformance } from "./analysis.ts";
import { sql } from "drizzle-orm";

function hr(label: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${label}`);
  console.log("─".repeat(60));
}

function table(rows: any[], cols: string[]) {
  if (rows.length === 0) { console.log("  (데이터 없음)"); return; }
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? "").length)));
  const fmt = (row: any) => cols.map((c, i) => String(row[c] ?? "").padEnd(widths[i])).join("  ");
  console.log("  " + cols.map((c, i) => c.padEnd(widths[i])).join("  "));
  console.log("  " + widths.map(w => "─".repeat(w)).join("  "));
  rows.forEach(r => console.log("  " + fmt(r)));
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║    Mirra 플라이휠 PoC — end-to-end 미니 파이프라인      ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // STEP 0: 초기화 (매 실행마다 클린 상태)
  initTables();
  db.run(sql`DELETE FROM content_ideas`);
  db.run(sql`DELETE FROM carousel_generations`);
  db.run(sql`DELETE FROM scheduled_posts`);
  db.run(sql`DELETE FROM post_analytics`);
  db.run(sql`DELETE FROM agent_queries`);
  db.run(sql`DELETE FROM content_performance_map`);

  // ──────────────────────────────────────────────────────────────
  hr("STEP 1 │ 기존 데이터 시드 (현재 Mirra 구조 시뮬레이션)");
  // ──────────────────────────────────────────────────────────────
  await seed();

  // BEFORE: content_performance_map이 비어있음을 확인
  const beforeCount = (db.all(sql`SELECT COUNT(*) as n FROM content_performance_map`)[0] as any).n;
  console.log(`\n  ⚠ content_performance_map: ${beforeCount}개 (기획↔성과 연결 없음)`);
  console.log("  ⚠ 이 상태에서는 '어떤 기획이 좋은 성과로 이어졌는가' 분석 불가");

  // ──────────────────────────────────────────────────────────────
  hr("STEP 2 │ content_performance_map 백필 (4-hop 연결)");
  // ──────────────────────────────────────────────────────────────
  await backfill();

  // ──────────────────────────────────────────────────────────────
  hr("STEP 3 │ Agent 쿼리 수집 및 인텐트 분류");
  // ──────────────────────────────────────────────────────────────

  const testQueries = [
    { q: "인스타그램에 이번 주 신제품 카드뉴스 만들어줘", accepted: true, editCount: 1 },
    { q: "틱톡용 숏폼 영상 만들어줘", accepted: true, editCount: 0 },
    { q: "지난달 성과 분석해줘", accepted: true, editCount: 0 },
    { q: "인스타그램 이번주 콘텐츠 예약해줘", accepted: false, editCount: 2 },
    { q: "카카오채널 카드뉴스 만들어줘", accepted: true, editCount: 1 },
  ];

  console.log("\n  자연어 쿼리 분류 결과:");
  console.log("  " + "─".repeat(80));

  const storedQueryIds: string[] = [];
  for (const { q, accepted, editCount } of testQueries) {
    const classified = classify(q);
    const id = `aq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    storedQueryIds.push(id);

    await db.insert(agentQueries).values({
      id,
      workspaceId: "ws-mirra-demo",
      rawQuery: q,
      intentType: classified.intentType,
      targetPlatform: classified.targetPlatform,
      contentFormat: classified.contentFormat,
      timeReference: classified.timeReference,
      resolvedAction: classified.resolvedAction,
      wasAccepted: accepted,
      editCount,
      creditUsed: classified.intentType === "create" ? 5 : 0,
      createdAt: new Date().toISOString(),
    });

    console.log(`  Q: "${q}"`);
    console.log(`     → intent: ${classified.intentType} | platform: ${classified.targetPlatform ?? "-"} | format: ${classified.contentFormat ?? "-"} | action: ${classified.resolvedAction ?? "-"}`);
  }

  // STEP 3-1: create 쿼리를 content_performance_map에 연결 (시뮬레이션)
  // 실제로는 Agent가 콘텐츠 생성 후 output_ref_id를 기록하고 backfill이 연결
  const createQueries = await db
    .select()
    .from(agentQueries)
    .all();

  const createQueryIds = createQueries
    .filter(q => q.intentType === "create" && q.wasAccepted)
    .map(q => q.id);

  // gen-1, gen-2 에 agent_query_id 연결 (시뮬레이션)
  if (createQueryIds.length >= 2) {
    db.run(sql`UPDATE content_performance_map SET agent_query_id = ${createQueryIds[0]} WHERE generation_id = 'gen-1'`);
    db.run(sql`UPDATE content_performance_map SET agent_query_id = ${createQueryIds[1]} WHERE generation_id = 'gen-3'`);
  }

  // ──────────────────────────────────────────────────────────────
  hr("STEP 4 │ 분석 루프 실행");
  // ──────────────────────────────────────────────────────────────

  console.log("\n  [루프 1] 기획 소스 유형별 평균 성과");
  console.log("  ▶ Agent 제안 근거: 어떤 기획 방식이 더 높은 참여율로 이어지는가");
  const loop1 = loop1_ideaSourcePerformance();
  table(loop1, ["source_type", "post_count", "avg_engagement_pct", "avg_impressions", "avg_ctr_pct"]);

  const topSource = loop1[0];
  const bottomSource = loop1[loop1.length - 1];
  if (topSource && bottomSource && topSource.source_type !== bottomSource.source_type) {
    const ratio = (topSource.avg_engagement_pct / bottomSource.avg_engagement_pct).toFixed(1);
    console.log(`\n  → 인사이트: '${topSource.source_type}' 기반 콘텐츠가 '${bottomSource.source_type}'보다 참여율 ${ratio}배 높음`);
    console.log(`    Agent 제안 문구 예시: "${topSource.source_type} 기반 기획을 사용하면 참여율이 평균 ${ratio}배 향상됩니다"`);
  }

  console.log("\n  [루프 2] 플랫폼별 성과 비교");
  console.log("  ▶ 수평 배포(기획 1개 → 여러 SNS) 우선순위 결정에 활용");
  const loop2 = loop2_platformPerformance();
  table(loop2, ["platform", "post_count", "avg_engagement_pct", "avg_impressions", "total_likes", "total_saves"]);

  console.log("\n  [루프 3] Agent 쿼리 인텐트별 성과");
  console.log("  ▶ '어떤 요청 패턴이 높은 성과의 콘텐츠로 이어지는가'");
  const loop3 = loop3_agentQueryPerformance();
  if (loop3.length > 0) {
    table(loop3, ["intent_type", "target_platform", "content_format", "query_count", "accepted_count", "avg_engagement_pct", "avg_edits"]);
  } else {
    console.log("  (Agent 쿼리가 성과 데이터와 연결된 레코드 없음 — 더 많은 데이터 필요)");
  }

  // ──────────────────────────────────────────────────────────────
  hr("STEP 5 │ 검증 요약 (before / after)");
  // ──────────────────────────────────────────────────────────────

  const afterCount = (db.all(sql`SELECT COUNT(*) as n FROM content_performance_map`)[0] as any).n;
  const agentCount = (db.all(sql`SELECT COUNT(*) as n FROM agent_queries`)[0] as any).n;
  const linkedCount = (db.all(sql`SELECT COUNT(*) as n FROM content_performance_map WHERE content_idea_id IS NOT NULL`)[0] as any).n;
  const unlinkedCount = afterCount - linkedCount;

  console.log("\n  항목                          BEFORE   AFTER");
  console.log("  " + "─".repeat(50));
  console.log(`  content_performance_map         ${String(beforeCount).padStart(4)}    ${String(afterCount).padStart(4)}`);
  console.log(`  기획 연결 레코드                   -       ${String(linkedCount).padStart(4)}`);
  console.log(`  기획 없음 레코드 (분석 사각지대)    -       ${String(unlinkedCount).padStart(4)}`);
  console.log(`  agent_queries 적재               -       ${String(agentCount).padStart(4)}`);
  console.log(`\n  → 분석 가능: 기획 소스 유형별 성과, 플랫폼별 성과, Agent 쿼리 패턴`);
  console.log(`  → 분석 불가: 기획 없이 만든 콘텐츠 ${unlinkedCount}개 (플라이휠 루프에서 이탈)`);

  console.log("\n✓ 파이프라인 완료. flywheel.db 에서 전체 데이터를 확인할 수 있습니다.\n");
}

main().catch(console.error);
