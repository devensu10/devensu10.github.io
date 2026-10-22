/**
 * Pages Functions: /api/views-batch?slugs=slug1,slug2,slug3
 * 返回 { "slug1": 123, "slug2": 45 }
 * 供首页 /posts 列表卡片批量查询，避免 N+1。
 */

type Env = { DB: D1Database };
const SLUG_RE = /^[\p{L}\p{N}\/_.-]{1,300}$/u;

function cors(origin: string | null): Record<string, string> {
  const safeOrigin =
    origin &&
    /^https?:\/\/([a-zA-Z0-9-]+\.)+(dev|pages\.dev|com|cn|net)(:\d+)?$/.test(origin)
      ? origin
      : "*";
  return {
    "access-control-allow-origin": safeOrigin,
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
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: cors(origin),
    });
  }

  const raw = new URL(request.url).searchParams.get("slugs") ?? "";
  const slugs = Array.from(
    new Set(
      raw
        .split(",")
        .map(s => s.trim())
        .filter(s => s && SLUG_RE.test(s)),
    ),
  );

  const result: Record<string, number> = {};
  for (const s of slugs) result[s] = 0;
  if (slugs.length === 0) {
    return new Response(JSON.stringify(result), { headers: cors(origin) });
  }

  const placeholders = slugs.map(() => "?").join(",");
  const rows = await env.DB
    .prepare(`SELECT slug, count FROM views WHERE slug IN (${placeholders})`)
    .bind(...slugs)
    .all<{ slug: string; count: number }>();

  for (const row of rows.results) {
    result[row.slug] = row.count;
  }

  return new Response(JSON.stringify(result), { headers: cors(origin) });
}
