/**
 * Pages Functions: /api/views?slug=<slug>
 * - GET  返回该文章当前阅读量
 * - POST 阅读量 +1（前端同会话用 localStorage 去重）
 *
 * 运行前提：
 *   1. wrangler.toml 已绑定 D1（binding 名 DB）
 *   2. 已执行 d1/schema.sql 建表
 *   3. 部署到 Cloudflare Pages 或本地 wrangler pages dev
 */

type Env = { DB: D1Database };

const ALLOWED = ["GET", "POST"];
const SLUG_RE = /^[\p{L}\p{N}\/_.-]{1,300}$/u;

function cors(origin: string | null): Record<string, string> {
  const safeOrigin =
    origin &&
    /^https?:\/\/([a-zA-Z0-9-]+\.)+(dev|pages\.dev|com|cn|net)(:\d+)?$/.test(origin)
      ? origin
      : "*";
  return {
    "access-control-allow-origin": safeOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-max-age": "3600",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  };
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (!ALLOWED.includes(request.method)) {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: cors(origin),
    });
  }

  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!SLUG_RE.test(slug)) {
    return new Response(JSON.stringify({ error: "invalid slug" }), {
      status: 400,
      headers: cors(origin),
    });
  }

  const db: D1Database = env.DB;

  if (request.method === "POST") {
    await db
      .prepare(
        "INSERT INTO views (slug, count, updated_at) VALUES (?, 1, datetime('now')) ON CONFLICT(slug) DO UPDATE SET count = count + 1, updated_at = datetime('now')",
      )
      .bind(slug)
      .run();
  }

  const row = await db
    .prepare("SELECT count FROM views WHERE slug = ?")
    .bind(slug)
    .first<{ count: number }>();

  return new Response(
    JSON.stringify({ slug, count: row?.count ?? 0 }),
    { headers: cors(origin) },
  );
}
