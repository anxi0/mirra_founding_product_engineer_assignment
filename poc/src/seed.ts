import { db, initTables } from "./db.ts";
import {
  contentIdeas, carouselGenerations, scheduledPosts, postAnalytics
} from "./schema.ts";

const WS = "ws-mirra-demo";
const now = new Date().toISOString();
const d = (offset: number) => new Date(Date.now() - offset * 86400000).toISOString();

export async function seed() {
  initTables();

  // ── 기획을 거친 콘텐츠 3개 (레퍼런스 리서치 → 인스타그램) ──────────────
  await db.insert(contentIdeas).values([
    { id: "idea-1", workspaceId: WS, platform: "instagram",
      sourceType: "reference", topic: "신제품 출시 카드뉴스", status: "used", createdAt: d(10) },
    { id: "idea-2", workspaceId: WS, platform: "instagram",
      sourceType: "reference", topic: "고객 후기 모음", status: "used", createdAt: d(7) },
    { id: "idea-3", workspaceId: WS, platform: "tiktok",
      sourceType: "web_search", topic: "제품 사용법 숏폼", status: "used", createdAt: d(5) },
  ]).onConflictDoNothing();

  // ── 기획 없이 바로 만든 콘텐츠 2개 (content_idea_id = null) ────────────
  await db.insert(carouselGenerations).values([
    { id: "gen-1", workspaceId: WS, contentIdeaId: "idea-1",
      creationMethod: "from_idea", topic: "신제품 출시 카드뉴스",
      aspectRatio: "4:5", creditUsed: 5, createdAt: d(9) },
    { id: "gen-2", workspaceId: WS, contentIdeaId: "idea-2",
      creationMethod: "from_idea", topic: "고객 후기 모음",
      aspectRatio: "1:1", creditUsed: 5, createdAt: d(6) },
    { id: "gen-3", workspaceId: WS, contentIdeaId: "idea-3",
      creationMethod: "from_idea", topic: "제품 사용법 숏폼",
      aspectRatio: "9:16", creditUsed: 8, createdAt: d(4) },
    // 기획 없이 직접 생성 (content_idea_id = null)
    { id: "gen-4", workspaceId: WS, contentIdeaId: null,
      creationMethod: "direct", topic: "이벤트 공지",
      aspectRatio: "1:1", creditUsed: 5, createdAt: d(3) },
    { id: "gen-5", workspaceId: WS, contentIdeaId: null,
      creationMethod: "from_link", topic: "블로그 요약",
      aspectRatio: "4:5", creditUsed: 5, createdAt: d(1) },
  ]).onConflictDoNothing();

  await db.insert(scheduledPosts).values([
    { id: "post-1", workspaceId: WS, socialAccountId: "acct-ig",
      platform: "instagram", contentType: "carousel", contentRefId: "gen-1",
      status: "published", publishedAt: d(8), createdAt: d(9) },
    { id: "post-2", workspaceId: WS, socialAccountId: "acct-ig",
      platform: "instagram", contentType: "carousel", contentRefId: "gen-2",
      status: "published", publishedAt: d(5), createdAt: d(6) },
    { id: "post-3", workspaceId: WS, socialAccountId: "acct-tt",
      platform: "tiktok", contentType: "carousel", contentRefId: "gen-3",
      status: "published", publishedAt: d(3), createdAt: d(4) },
    { id: "post-4", workspaceId: WS, socialAccountId: "acct-ig",
      platform: "instagram", contentType: "carousel", contentRefId: "gen-4",
      status: "published", publishedAt: d(2), createdAt: d(3) },
    { id: "post-5", workspaceId: WS, socialAccountId: "acct-ig",
      platform: "instagram", contentType: "carousel", contentRefId: "gen-5",
      status: "published", publishedAt: d(0), createdAt: d(1) },
  ]).onConflictDoNothing();

  // 레퍼런스 기반 콘텐츠가 직접 생성보다 성과가 높은 데이터
  await db.insert(postAnalytics).values([
    { id: "ana-1", scheduledPostId: "post-1", platform: "instagram",
      impressions: 4200, reach: 3100, likes: 312, commentsCount: 28,
      saves: 95, engagementRate: 0.104, clickThroughRate: 0.032, syncedAt: now },
    { id: "ana-2", scheduledPostId: "post-2", platform: "instagram",
      impressions: 3800, reach: 2900, likes: 285, commentsCount: 21,
      saves: 87, engagementRate: 0.103, clickThroughRate: 0.029, syncedAt: now },
    { id: "ana-3", scheduledPostId: "post-3", platform: "tiktok",
      impressions: 6500, reach: 5200, likes: 520, commentsCount: 44,
      saves: 130, engagementRate: 0.107, clickThroughRate: 0.041, syncedAt: now },
    // 기획 없이 만든 콘텐츠 — 성과 낮음
    { id: "ana-4", scheduledPostId: "post-4", platform: "instagram",
      impressions: 1200, reach: 980, likes: 67, commentsCount: 5,
      saves: 12, engagementRate: 0.070, clickThroughRate: 0.011, syncedAt: now },
    { id: "ana-5", scheduledPostId: "post-5", platform: "instagram",
      impressions: 1050, reach: 890, likes: 58, commentsCount: 4,
      saves: 9, engagementRate: 0.067, clickThroughRate: 0.009, syncedAt: now },
  ]).onConflictDoNothing();

  console.log("✓ 시드 데이터 삽입 완료");
  console.log("  content_ideas: 3개 (레퍼런스 기반 2, 웹 검색 1)");
  console.log("  carousel_generations: 5개 (기획 연결 3, 기획 없음 2)");
  console.log("  scheduled_posts: 5개 발행");
  console.log("  post_analytics: 5개 성과 기록");
}
