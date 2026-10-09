

const ALLOWED_ORIGIN = "https://YOUR-USERNAME.github.io";

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = origin === ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      if (!allowed) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    if (!allowed) {
      return json({ error: "Origin not allowed" }, 403);
    }

    try {
      // 新しい共有シートを作成
      if (url.pathname === "/api/sheets" &&
          request.method === "POST") {
        const body = await request.json();
        if (!body.data || typeof body.data !== "object" ||
            Array.isArray(body.data)) {
          return json({ error: "Invalid sheet data" }, 400);
        }

        const dataJson = JSON.stringify(body.data);
        if (new TextEncoder().encode(dataJson).length > 1500000) {
          return json({ error: "Sheet too large" }, 413);
        }

        const id = crypto.randomUUID().replaceAll("-", "");
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(
          "INSERT INTO sheets (id, data_json, created_at, updated_at) VALUES (?, ?, ?, ?)"
        ).bind(id, dataJson, now, now).run();

        return json({ id });
      }

      const match = url.pathname.match(/^\/api\/sheets\/([a-f0-9]{32})$/);
      if (!match) return json({ error: "Not found" }, 404);

      const id = match[1];

      // 共有シートを取得
      if (request.method === "GET") {
        const row = await env.DB.prepare(
          "SELECT data_json FROM sheets WHERE id = ?"
        ).bind(id).first();

        if (!row) return json({ error: "Sheet not found" }, 404);
        return json({ id, data: JSON.parse(row.data_json) });
      }

      // 共有シートを更新
      if (request.method === "PUT") {
        const body = await request.json();
        if (!body.data || typeof body.data !== "object" ||
            Array.isArray(body.data)) {
          return json({ error: "Invalid sheet data" }, 400);
        }

        const dataJson = JSON.stringify(body.data);
        if (new TextEncoder().encode(dataJson).length > 1500000) {
          return json({ error: "Sheet too large" }, 413);
        }

        const result = await env.DB.prepare(
          "UPDATE sheets SET data_json = ?, updated_at = ? WHERE id = ?"
        ).bind(dataJson, Math.floor(Date.now() / 1000), id).run();

        if (!result.meta.changes) {
          return json({ error: "Sheet not found" }, 404);
        }

        return json({ ok: true });
      }

      return json({ error: "Method not allowed" }, 405);
    } catch (error) {
      return json({ error: "Server error" }, 500);
    }
  }
};
