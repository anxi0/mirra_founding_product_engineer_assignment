import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agentQueries } from "@/db/schema";
import { classify } from "@/lib/intent-classifier";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  const classified = classify(query);
  const id = `aq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  await db.insert(agentQueries).values({
    id,
    workspaceId: "ws-mirra-demo",
    rawQuery: query,
    intentType: classified.intentType,
    targetPlatform: classified.targetPlatform,
    contentFormat: classified.contentFormat,
    timeReference: classified.timeReference,
    resolvedAction: classified.resolvedAction,
    wasAccepted: null,
    editCount: 0,
    creditUsed: classified.intentType === "create" ? 5 : 0,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id, ...classified });
}

export async function GET() {
  const rows = db.all(sql`
    SELECT id, raw_query, intent_type, target_platform, content_format,
           time_reference, resolved_action, credit_used, created_at
    FROM agent_queries
    ORDER BY created_at DESC
    LIMIT 20
  `);
  return NextResponse.json(rows);
}
