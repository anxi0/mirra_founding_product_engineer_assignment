import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const loop1 = db.all(sql`
    SELECT
      COALESCE(idea_source_type, '기획없음(direct)') AS source_type,
      COUNT(*) AS post_count,
      ROUND(AVG(engagement_rate) * 100, 2) AS avg_engagement_pct,
      ROUND(AVG(impressions), 0) AS avg_impressions,
      ROUND(AVG(click_through_rate) * 100, 2) AS avg_ctr_pct
    FROM content_performance_map
    GROUP BY idea_source_type
    ORDER BY avg_engagement_pct DESC
  `);

  const loop2 = db.all(sql`
    SELECT
      platform,
      COUNT(*) AS post_count,
      ROUND(AVG(engagement_rate) * 100, 2) AS avg_engagement_pct,
      ROUND(AVG(impressions), 0) AS avg_impressions,
      SUM(likes) AS total_likes,
      SUM(saves) AS total_saves
    FROM content_performance_map
    GROUP BY platform
    ORDER BY avg_engagement_pct DESC
  `);

  const loop3 = db.all(sql`
    SELECT
      aq.intent_type,
      aq.target_platform,
      aq.content_format,
      COUNT(*) AS query_count,
      SUM(CASE WHEN aq.was_accepted = 1 THEN 1 ELSE 0 END) AS accepted_count,
      ROUND(AVG(cpm.engagement_rate) * 100, 2) AS avg_engagement_pct,
      ROUND(AVG(aq.edit_count), 1) AS avg_edits
    FROM agent_queries aq
    LEFT JOIN content_performance_map cpm ON cpm.agent_query_id = aq.id
    GROUP BY aq.intent_type, aq.target_platform, aq.content_format
    ORDER BY avg_engagement_pct DESC
  `);

  const counts = db.all(sql`
    SELECT
      (SELECT COUNT(*) FROM content_ideas) AS ideas,
      (SELECT COUNT(*) FROM carousel_generations) AS generations,
      (SELECT COUNT(*) FROM scheduled_posts) AS posts,
      (SELECT COUNT(*) FROM post_analytics) AS analytics,
      (SELECT COUNT(*) FROM content_performance_map) AS cpm,
      (SELECT COUNT(*) FROM content_performance_map WHERE content_idea_id IS NOT NULL) AS cpm_linked,
      (SELECT COUNT(*) FROM agent_queries) AS agent_queries
  `)[0];

  return NextResponse.json({ loop1, loop2, loop3, counts });
}
