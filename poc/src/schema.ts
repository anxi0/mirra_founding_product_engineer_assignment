import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── 기존 테이블 (Mirra 현재 구조 축약) ──────────────────────────────────

export const contentIdeas = sqliteTable("content_ideas", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  platform: text("platform").notNull(),         // 'instagram' | 'tiktok' | 'kakao'
  sourceType: text("source_type").notNull(),     // 'self_create' | 'reference' | 'web_search'
  topic: text("topic").notNull(),
  status: text("status").notNull(),              // 'pending' | 'drafted' | 'used'
  createdAt: text("created_at").notNull(),
});

export const carouselGenerations = sqliteTable("carousel_generations", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  contentIdeaId: text("content_idea_id"),        // nullable — 기획 없이 만든 경우
  creationMethod: text("creation_method").notNull(), // 'direct' | 'from_idea' | 'from_link'
  topic: text("topic").notNull(),
  aspectRatio: text("aspect_ratio").notNull(),
  creditUsed: integer("credit_used").notNull(),
  createdAt: text("created_at").notNull(),
});

export const scheduledPosts = sqliteTable("scheduled_posts", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  socialAccountId: text("social_account_id").notNull(),
  platform: text("platform").notNull(),
  contentType: text("content_type").notNull(),   // 'carousel' | 'video'
  contentRefId: text("content_ref_id").notNull(),
  status: text("status").notNull(),              // 'published' | 'scheduled' | 'failed'
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull(),
});

export const postAnalytics = sqliteTable("post_analytics", {
  id: text("id").primaryKey(),
  scheduledPostId: text("scheduled_post_id").notNull(),
  platform: text("platform").notNull(),
  impressions: integer("impressions").notNull(),
  reach: integer("reach").notNull(),
  likes: integer("likes").notNull(),
  commentsCount: integer("comments_count").notNull(),
  saves: integer("saves").notNull(),
  engagementRate: real("engagement_rate").notNull(),
  clickThroughRate: real("click_through_rate").notNull(),
  syncedAt: text("synced_at").notNull(),
});

// ── 신규 테이블 (플라이휠 PoC) ──────────────────────────────────────────

export const agentQueries = sqliteTable("agent_queries", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  rawQuery: text("raw_query").notNull(),
  intentType: text("intent_type").notNull(),     // 'create' | 'schedule' | 'analyze' | 'edit' | 'ask'
  targetPlatform: text("target_platform"),       // 'instagram' | 'tiktok' | 'kakao' | null
  contentFormat: text("content_format"),         // 'carousel' | 'video' | 'text' | null
  timeReference: text("time_reference"),         // 'this_week' | 'tomorrow' | 'today' | null
  resolvedAction: text("resolved_action"),
  outputRefId: text("output_ref_id"),
  wasAccepted: integer("was_accepted", { mode: "boolean" }),
  editCount: integer("edit_count").default(0),
  creditUsed: integer("credit_used").default(0),
  createdAt: text("created_at").notNull(),
});

// 기획→생성→발행→성과 4-hop을 단일 레코드로 연결하는 집계 테이블
export const contentPerformanceMap = sqliteTable("content_performance_map", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  // 기획 단계
  contentIdeaId: text("content_idea_id"),        // nullable (기획 없이 생성된 경우)
  ideaSourceType: text("idea_source_type"),       // content_ideas.source_type 역정규화
  ideaPlatform: text("idea_platform"),
  agentQueryId: text("agent_query_id"),           // nullable (Agent 경유 여부)
  // 생성 단계
  generationId: text("generation_id").notNull(),
  generationType: text("generation_type").notNull(),
  creationMethod: text("creation_method").notNull(),
  // 발행 단계
  scheduledPostId: text("scheduled_post_id"),
  platform: text("platform").notNull(),
  publishedAt: text("published_at"),
  // 성과 스냅샷
  impressions: integer("impressions"),
  reach: integer("reach"),
  likes: integer("likes"),
  saves: integer("saves"),
  engagementRate: real("engagement_rate"),
  clickThroughRate: real("click_through_rate"),
  performanceSnapAt: text("performance_snap_at"),
  createdAt: text("created_at").notNull(),
});
