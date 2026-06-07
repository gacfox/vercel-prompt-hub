import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { DDL } from "@/lib/db-init";

export const runtime = "edge";

export async function POST() {
  try {
    // Check if already initialized
    const initialized = await redis.get("vph:db-initialized");
    if (initialized) {
      return NextResponse.json({
        success: false,
        error: "数据库已初始化",
      });
    }

    // Split DDL into individual statements and execute each
    const statements = DDL.split(";").map((s) => s.trim()).filter(Boolean);

    for (const stmt of statements) {
      await sql.query(stmt);
    }

    // Only mark as initialized after all statements succeed
    await redis.set("vph:db-initialized", "true");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[vph] Setup error:", error);
    return NextResponse.json(
      { success: false, error: "初始化失败，请检查数据库连接后重试" },
      { status: 500 }
    );
  }
}
