import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const contentIdeas = sqliteTable("content_ideas", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  platform: text("platform").notNull(),
  sourceType: text("source_type").notNull(),
  topic: text("topic").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const carouselGenerations = sqliteTable("carousel_generations", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  contentIdeaId: text("content_idea_id"),
  creationMethod: text("creation_method").notNull(),
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
  contentType: text("content_type").notNull(),
  contentRefId: text("content_ref_id").notNull(),
  status: text("status").notNull(),
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

export const agentQueries = sqliteTable("agent_queries", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  rawQuery: text("raw_query").notNull(),
  intentType: text("intent_type").notNull(),
  targetPlatform: text("target_platform"),
  contentFormat: text("content_format"),
  timeReference: text("time_reference"),
  resolvedAction: text("resolved_action"),
  wasAccepted: integer("was_accepted", { mode: "boolean" }),
  editCount: integer("edit_count").default(0),
  creditUsed: integer("credit_used").default(0),
  createdAt: text("created_at").notNull(),
});

export const contentPerformanceMap = sqliteTable("content_performance_map", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  contentIdeaId: text("content_idea_id"),
  ideaSourceType: text("idea_source_type"),
  ideaPlatform: text("idea_platform"),
  agentQueryId: text("agent_query_id"),
  generationId: text("generation_id").notNull(),
  generationType: text("generation_type").notNull(),
  creationMethod: text("creation_method").notNull(),
  scheduledPostId: text("scheduled_post_id"),
  platform: text("platform").notNull(),
  publishedAt: text("published_at"),
  impressions: integer("impressions"),
  reach: integer("reach"),
  likes: integer("likes"),
  saves: integer("saves"),
  engagementRate: real("engagement_rate"),
  clickThroughRate: real("click_through_rate"),
  performanceSnapAt: text("performance_snap_at"),
  createdAt: text("created_at").notNull(),
});
