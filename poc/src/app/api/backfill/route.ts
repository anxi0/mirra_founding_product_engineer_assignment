import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST() {
  const before = (db.all(sql`SELECT COUNT(*) as n FROM content_performance_map`)[0] as any).n;

  db.run(sql`
    INSERT OR IGNORE INTO content_performance_map (
      id, workspace_id, content_idea_id, idea_source_type, idea_platform,
      agent_query_id, generation_id, generation_type, creation_method,
      scheduled_post_id, platform, published_at,
      impressions, reach, likes, saves, engagement_rate, click_through_rate,
      performance_snap_at, created_at
    )
    SELECT
      'cpm-' || sp.id, sp.workspace_id,
      cg.content_idea_id, ci.source_type, ci.platform,
      NULL, cg.id, 'carousel', cg.creation_method,
      sp.id, sp.platform, sp.published_at,
      pa.impressions, pa.reach, pa.likes, pa.saves,
      pa.engagement_rate, pa.click_through_rate,
      pa.synced_at, datetime('now')
    FROM carousel_generations cg
    JOIN scheduled_posts sp ON sp.content_ref_id = cg.id AND sp.status = 'published'
    JOIN post_analytics pa ON pa.scheduled_post_id = sp.id
    LEFT JOIN content_ideas ci ON ci.id = cg.content_idea_id
  `);

  const after = (db.all(sql`SELECT COUNT(*) as n FROM content_performance_map`)[0] as any).n;

  const coverage = db.all(sql`
    SELECT
      CASE WHEN content_idea_id IS NULL THEN '기획없음' ELSE '기획있음' END AS type,
      COUNT(*) AS cnt,
      ROUND(AVG(engagement_rate) * 100, 2) AS avg_engagement_pct
    FROM content_performance_map
    GROUP BY type
  `);

  return NextResponse.json({ ok: true, before, after, coverage });
}
