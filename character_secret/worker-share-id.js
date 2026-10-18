const ALLOWED_ORIGIN = "https://yu12272.github.io";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000;
const MAX_CHARACTER_JSON_BYTES = 1500000;

function corsHeaders(origin) {
  if (origin !== ALLOWED_ORIGIN) return {};

  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Key",
    "Vary": "Origin",
  };
}

function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers });
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomToken(byteLength = 32) {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );

  return [
    "pbkdf2_sha256",
    PBKDF2_ITERATIONS,
    toBase64Url(salt),
    toBase64Url(new Uint8Array(bits)),
  ].join("$");
}

async function verifyPassword(password, storedHash) {
  const [algorithm, iterationsText, saltText, expectedText] =
    String(storedHash || "").split("$");

  if (algorithm !== "pbkdf2_sha256") return false;

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 1) return false;

  let salt;
  let expected;

  try {
    salt = fromBase64Url(saltText);
    expected = fromBase64Url(expectedText);
  } catch {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    key,
    256,
  );

  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;

  let difference = 0;
  for (let i = 0; i < actual.length; i++) {
    difference |= actual[i] ^ expected[i];
  }

  return difference === 0;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function createSession(env, userId) {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;

  await env.DB.prepare(
    `INSERT INTO sessions (session_hash, user_id, expires_at)
     VALUES (?, ?, ?)`,
  )
    .bind(tokenHash, userId, expiresAt)
    .run();

  return { token, expiresAt };
}

async function findSessionUser(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) return null;

  const tokenHash = await sha256Hex(match[1]);
  const now = Math.floor(Date.now() / 1000);

  return await env.DB.prepare(
    `SELECT users.user_id, users.username
     FROM sessions
     JOIN users ON users.user_id = sessions.user_id
     WHERE sessions.session_hash = ?
       AND sessions.expires_at > ?`,
  )
    .bind(tokenHash, now)
    .first();
}

function validCharacterData(data) {
  return (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data)
  );
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    try {
      // WorkerとD1の接続確認
      if (url.pathname === "/api/health" && request.method === "GET") {
        await env.DB.prepare("SELECT 1").first();

        return json(
          { ok: true, database: "connected" },
          200,
          headers,
        );
      }

      // 管理者専用：利用者アカウントを事前登録
      if (url.pathname === "/api/admin/users" && request.method === "POST") {
        const adminKey = request.headers.get("X-Admin-Key");

        if (!env.ADMIN_SETUP_KEY || adminKey !== env.ADMIN_SETUP_KEY) {
          return json({ error: "管理者認証に失敗しました" }, 403, headers);
        }

        const body = await readJson(request);
        const username = String(body?.username || "").trim().toLowerCase();
        const password = String(body?.password || "");

        if (!/^[a-z0-9_-]{3,24}$/.test(username)) {
          return json(
            { error: "ユーザー名は英小文字・数字・_・-の3〜24文字にしてください" },
            400,
            headers,
          );
        }

        if (password.length < 12 || password.length > 128) {
          return json(
            { error: "パスワードは12〜128文字にしてください" },
            400,
            headers,
          );
        }

        const existing = await env.DB.prepare(
          "SELECT user_id FROM users WHERE username = ?",
        )
          .bind(username)
          .first();

        if (existing) {
          return json(
            { error: "このユーザー名はすでに登録されています" },
            409,
            headers,
          );
        }

        const userId = crypto.randomUUID();
        const passwordHash = await hashPassword(password);

        await env.DB.prepare(
          `INSERT INTO users (user_id, username, password_hash)
           VALUES (?, ?, ?)`,
        )
          .bind(userId, username, passwordHash)
          .run();

        return json(
          { ok: true, user: { userId, username } },
          201,
          headers,
        );
      }

      // 事前登録済みユーザーのログイン
      if (url.pathname === "/api/login" && request.method === "POST") {
        const body = await readJson(request);
        const username = String(body?.username || "").trim().toLowerCase();
        const password = String(body?.password || "");

        const user = await env.DB.prepare(
          `SELECT user_id, username, password_hash
           FROM users
           WHERE username = ?`,
        )
          .bind(username)
          .first();

        if (!user || !(await verifyPassword(password, user.password_hash))) {
          return json(
            { error: "ユーザー名またはパスワードが違います" },
            401,
            headers,
          );
        }

        const session = await createSession(env, user.user_id);

        return json(
          {
            ok: true,
            user: { userId: user.user_id, username: user.username },
            token: session.token,
            expiresAt: session.expiresAt,
          },
          200,
          headers,
        );
      }

      // ログインユーザーの確認
      if (url.pathname === "/api/me" && request.method === "GET") {
        const user = await findSessionUser(request, env);

        if (!user) {
          return json({ error: "ログインが必要です" }, 401, headers);
        }

        return json(
          {
            ok: true,
            user: { userId: user.user_id, username: user.username },
          },
          200,
          headers,
        );
      }

      // ログアウト
      if (url.pathname === "/api/logout" && request.method === "POST") {
        const authorization = request.headers.get("Authorization") || "";
        const match = authorization.match(/^Bearer\s+(.+)$/i);

        if (match) {
          const tokenHash = await sha256Hex(match[1]);

          await env.DB.prepare(
            "DELETE FROM sessions WHERE session_hash = ?",
          )
            .bind(tokenHash)
            .run();
        }

        return json({ ok: true }, 200, headers);
      }

      // 自分のキャラクター一覧
      if (url.pathname === "/api/characters" && request.method === "GET") {
        const user = await findSessionUser(request, env);

        if (!user) {
          return json({ error: "ログインが必要です" }, 401, headers);
        }

        const result = await env.DB.prepare(
          `SELECT character_id, character_name, created_at, updated_at
           FROM characters
           WHERE user_id = ?
           ORDER BY updated_at DESC`,
        )
          .bind(user.user_id)
          .all();

        return json({ characters: result.results }, 200, headers);
      }

      // 新規キャラクター作成
      if (url.pathname === "/api/characters" && request.method === "POST") {
        const user = await findSessionUser(request, env);

        if (!user) {
          return json({ error: "ログインが必要です" }, 401, headers);
        }

        const body = await readJson(request);
        const characterName = String(body?.characterName || "").trim();
        const characterData = body?.characterData;

        if (!characterName) {
          return json({ error: "キャラクター名を入力してください" }, 400, headers);
        }

        if (characterName.length > 100) {
          return json({ error: "キャラクター名は100文字以内にしてください" }, 400, headers);
        }

        if (!validCharacterData(characterData)) {
          return json({ error: "キャラクターデータが正しくありません" }, 400, headers);
        }

        const characterJson = JSON.stringify(characterData);

        if (new TextEncoder().encode(characterJson).byteLength > MAX_CHARACTER_JSON_BYTES) {
          return json({ error: "キャラクターデータが大きすぎます" }, 413, headers);
        }

        const characterId = crypto.randomUUID();

        await env.DB.prepare(
          `INSERT INTO characters
            (character_id, user_id, character_name, character_json)
           VALUES (?, ?, ?, ?)`,
        )
          .bind(characterId, user.user_id, characterName, characterJson)
          .run();

        return json(
          {
            ok: true,
            character: { characterId, characterName },
          },
          201,
          headers,
        );
      }

      // 共有URLからキャラクターを公開読み込み（削除されるとリンクも無効）
      const shareMatch = url.pathname.match(/^\/api\/share\/([a-f0-9-]+)$/i);
      if (shareMatch && request.method === "GET") {
        const row = await env.DB.prepare(
          `SELECT character_id, character_name, character_json,
                  created_at, updated_at
           FROM characters
           WHERE character_id = ?`,
        )
          .bind(shareMatch[1])
          .first();

        if (!row) {
          return json({ error: "共有キャラクターが見つかりません" }, 404, headers);
        }

        return json(
          {
            character: {
              characterId: row.character_id,
              characterName: row.character_name,
              characterData: JSON.parse(row.character_json),
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            },
          },
          200,
          headers,
        );
      }
      const characterMatch = url.pathname.match(
        /^\/api\/characters\/([a-f0-9-]+)$/i,
      );

      // 自分のキャラクター詳細
      if (characterMatch && request.method === "GET") {
        const user = await findSessionUser(request, env);

        if (!user) {
          return json({ error: "ログインが必要です" }, 401, headers);
        }

        const row = await env.DB.prepare(
          `SELECT character_id, character_name, character_json,
                  created_at, updated_at
           FROM characters
           WHERE character_id = ? AND user_id = ?`,
        )
          .bind(characterMatch[1], user.user_id)
          .first();

        if (!row) {
          return json({ error: "キャラクターが見つかりません" }, 404, headers);
        }

        return json(
          {
            character: {
              characterId: row.character_id,
              characterName: row.character_name,
              characterData: JSON.parse(row.character_json),
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            },
          },
          200,
          headers,
        );
      }

      // 自分のキャラクターを更新
      if (characterMatch && request.method === "PUT") {
        const user = await findSessionUser(request, env);

        if (!user) {
          return json({ error: "ログインが必要です" }, 401, headers);
        }

        const body = await readJson(request);
        const characterName = String(body?.characterName || "").trim();
        const characterData = body?.characterData;

        if (!characterName) {
          return json({ error: "キャラクター名を入力してください" }, 400, headers);
        }

        if (characterName.length > 100) {
          return json({ error: "キャラクター名は100文字以内にしてください" }, 400, headers);
        }

        if (!validCharacterData(characterData)) {
          return json({ error: "キャラクターデータが正しくありません" }, 400, headers);
        }

        const characterJson = JSON.stringify(characterData);

        if (new TextEncoder().encode(characterJson).byteLength > MAX_CHARACTER_JSON_BYTES) {
          return json({ error: "キャラクターデータが大きすぎます" }, 413, headers);
        }

        const result = await env.DB.prepare(
          `UPDATE characters
           SET character_name = ?,
               character_json = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE character_id = ? AND user_id = ?`,
        )
          .bind(
            characterName,
            characterJson,
            characterMatch[1],
            user.user_id,
          )
          .run();

        if (result.meta.changes === 0) {
          return json({ error: "キャラクターが見つかりません" }, 404, headers);
        }

        return json(
          {
            ok: true,
            character: {
              characterId: characterMatch[1],
              characterName,
            },
          },
          200,
          headers,
        );
      }

      // 自分のキャラクターを削除
      if (characterMatch && request.method === "DELETE") {
        const user = await findSessionUser(request, env);

        if (!user) {
          return json({ error: "ログインが必要です" }, 401, headers);
        }

        const result = await env.DB.prepare(
          `DELETE FROM characters
           WHERE character_id = ? AND user_id = ?`,
        )
          .bind(characterMatch[1], user.user_id)
          .run();

        if (result.meta.changes === 0) {
          return json({ error: "キャラクターが見つかりません" }, 404, headers);
        }

        return json({ ok: true }, 200, headers);
      }

      return json({ error: "Not found" }, 404, headers);
    } catch (error) {
      console.error("Worker API error:", error);

      return json(
        { error: "サーバー処理中にエラーが発生しました" },
        500,
        headers,
      );
    }
  },
};
