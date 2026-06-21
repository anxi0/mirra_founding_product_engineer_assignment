import { db } from "./db.ts";
import { sql } from "drizzle-orm";

// 루프 1: 기획 소스 유형별 평균 성과
// "레퍼런스 기반 기획이 직접 생성보다 참여율이 높은가?"
export function loop1_ideaSourcePerformance() {
  return db.all(sql`
    SELECT
      COALESCE(idea_source_type, '기획없음(direct)') AS source_type,
      COUNT(*)                                         AS post_count,
      ROUND(AVG(engagement_rate) * 100, 2)             AS avg_engagement_pct,
      ROUND(AVG(impressions), 0)                       AS avg_impressions,
      ROUND(AVG(click_through_rate) * 100, 2)          AS avg_ctr_pct
    FROM content_performance_map
    GROUP BY idea_source_type
    ORDER BY avg_engagement_pct DESC
  `) as {
    source_type: string;
    post_count: number;
    avg_engagement_pct: number;
    avg_impressions: number;
    avg_ctr_pct: number;
  }[];
}

// 루프 2: 플랫폼별 성과 비교
// "어느 채널이 가장 효율적인가? 수평 배포 우선순위 결정에 활용"
export function loop2_platformPerformance() {
  return db.all(sql`
    SELECT
      platform,
      COUNT(*)                                AS post_count,
      ROUND(AVG(engagement_rate) * 100, 2)    AS avg_engagement_pct,
      ROUND(AVG(impressions), 0)              AS avg_impressions,
      SUM(likes)                              AS total_likes,
      SUM(saves)                              AS total_saves
    FROM content_performance_map
    GROUP BY platform
    ORDER BY avg_engagement_pct DESC
  `) as {
    platform: string;
    post_count: number;
    avg_engagement_pct: number;
    avg_impressions: number;
    total_likes: number;
    total_saves: number;
  }[];
}

// 루프 3: Agent 쿼리 인텐트별 성과
// "어떤 요청 패턴이 높은 성과의 콘텐츠로 이어지는가?"
export function loop3_agentQueryPerformance() {
  return db.all(sql`
    SELECT
      aq.intent_type,
      aq.target_platform,
      aq.content_format,
      COUNT(*)                                AS query_count,
      SUM(CASE WHEN aq.was_accepted = 1 THEN 1 ELSE 0 END) AS accepted_count,
      ROUND(AVG(cpm.engagement_rate) * 100, 2) AS avg_engagement_pct,
      ROUND(AVG(aq.edit_count), 1)             AS avg_edits
    FROM agent_queries aq
    LEFT JOIN content_performance_map cpm ON cpm.agent_query_id = aq.id
    GROUP BY aq.intent_type, aq.target_platform, aq.content_format
    ORDER BY avg_engagement_pct DESC NULLS LAST
  `) as any[];
}
