import net from "node:net";
import { NextResponse } from "next/server";
import { db } from "@liberation-os/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

async function timeCheck(check: () => Promise<void>): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    await check();
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown readiness check failure",
    };
  }
}

function parseRedisUrl() {
  const redisUrl = new URL(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
  return {
    host: redisUrl.hostname,
    port: redisUrl.port ? Number(redisUrl.port) : 6379,
  };
}

async function checkRedisTcp(): Promise<void> {
  const { host, port } = parseRedisUrl();

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Redis readiness check timed out for ${host}:${port}`));
    }, 1500);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.end();
      resolve();
    });

    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

export async function GET() {
  const [database, redis] = await Promise.all([
    timeCheck(async () => {
      await db.$queryRaw`SELECT 1`;
    }),
    timeCheck(checkRedisTcp),
  ]);

  const ok = database.ok && redis.ok;

  return NextResponse.json(
    {
      ok,
      service: "web",
      checks: { database, redis },
    },
    { status: ok ? 200 : 503 },
  );
}
