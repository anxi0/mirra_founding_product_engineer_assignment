import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

// Vercel: /tmp만 쓰기 가능. PoC이므로 cold start 시 초기화(시드 버튼으로 재복구) 허용
const DB_PATH = process.env.NODE_ENV === "production"
  ? "/tmp/flywheel.db"
  : path.join(process.cwd(), "flywheel.db");

// Next.js dev 환경에서 핫 리로드 시 연결이 중복 생성되는 것을 방지
const globalForDb = global as unknown as { db: ReturnType<typeof drizzle> };

function createDb() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  initTables(sqlite);
  return drizzle(sqlite, { schema });
}

function initTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS content_ideas (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, platform TEXT NOT NULL,
      source_type TEXT NOT NULL, topic TEXT NOT NULL, status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS carousel_generations (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, content_idea_id TEXT,
      creation_method TEXT NOT NULL, topic TEXT NOT NULL, aspect_ratio TEXT NOT NULL,
      credit_used INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, social_account_id TEXT NOT NULL,
      platform TEXT NOT NULL, content_type TEXT NOT NULL, content_ref_id TEXT NOT NULL,
      status TEXT NOT NULL, published_at TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS post_analytics (
      id TEXT PRIMARY KEY, scheduled_post_id TEXT NOT NULL, platform TEXT NOT NULL,
      impressions INTEGER NOT NULL, reach INTEGER NOT NULL, likes INTEGER NOT NULL,
      comments_count INTEGER NOT NULL, saves INTEGER NOT NULL,
      engagement_rate REAL NOT NULL, click_through_rate REAL NOT NULL,
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agent_queries (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, raw_query TEXT NOT NULL,
      intent_type TEXT NOT NULL, target_platform TEXT, content_format TEXT,
      time_reference TEXT, resolved_action TEXT, output_ref_id TEXT,
      was_accepted INTEGER, edit_count INTEGER DEFAULT 0, credit_used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS content_performance_map (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL,
      content_idea_id TEXT, idea_source_type TEXT, idea_platform TEXT,
      agent_query_id TEXT, generation_id TEXT NOT NULL, generation_type TEXT NOT NULL,
      creation_method TEXT NOT NULL, scheduled_post_id TEXT, platform TEXT NOT NULL,
      published_at TEXT, impressions INTEGER, reach INTEGER, likes INTEGER,
      saves INTEGER, engagement_rate REAL, click_through_rate REAL,
      performance_snap_at TEXT, created_at TEXT NOT NULL
    );
  `);
}

export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
