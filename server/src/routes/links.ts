import { FastifyInstance } from "fastify";
import { randomBytes, randomUUID } from "crypto";
import { isIP } from "net";
import { db } from "../db";
import { links } from "../db/schema";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { putCsvObject } from "../lib/s3";

function isValidUrl(value: string) {
  if (typeof value !== "string") return false;
  if (value.trim() !== value) return false;
  if (value.length === 0) return false;
  if (value.endsWith(".")) return false;
  let decoded = value;
  try {
    decoded = decodeURI(value);
  } catch {}
  if (/[^\x00-\x7F]/.test(decoded)) return false;
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  if (u.username || u.password) return false;
  const hostname = u.hostname;
  if (!hostname) return false;
  if (hostname.endsWith(".")) return false;
  if (/[^\x00-\x7F]/.test(hostname)) return false;
  if (isIP(hostname) !== 0) return true;
  if (hostname === "localhost") return true;
  if (!/^[A-Za-z0-9.-]+$/.test(hostname)) return false;
  if (hostname.includes("..")) return false;
  const labels = hostname.split(".");
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }
  return true;
}

function isValidShortLink(value: string) {
  if (typeof value !== "string") return false;
  if (value.trim() !== value) return false;
  if (value.length === 0) return false;
  if (value.endsWith(".")) return false;
  if (/[^\x00-\x7F]/.test(value)) return false;
  return /^[a-zA-Z0-9_-]{3,32}$/.test(value);
}

function generateShortLink(size = 7) {
  const alphabet =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
  const bytes = randomBytes(size);
  let out = "";
  for (let i = 0; i < size; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function generateUniqueShortLink() {
  while (true) {
    const shortLink = generateShortLink();
    const found = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.shortUrl, shortLink))
      .limit(1);
    if (found.length === 0) return shortLink;
  }
}

function toCsvValue(v: unknown) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function linksRoutes(app: FastifyInstance) {
  function mapLink(row: any) {
    return {
      id: row.id,
      originalUrl: row.originalUrl,
      shortLink: row.shortUrl,
      accessCount: row.accessCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  const LinkSchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      originalUrl: { type: "string", format: "uri" },
      shortLink: { type: "string" },
      accessCount: { type: "integer" },
      createdAt: {
        anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
      },
      updatedAt: {
        anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
      },
    },
    required: ["id", "originalUrl", "shortLink"],
  };
  const ErrorSchema = {
    type: "object",
    properties: { error: { type: "string" } },
    required: ["error"],
  };

  app.post(
    "/",
    {
      schema: {
        tags: ["Links"],
        summary: "Cria link encurtado",
        body: {
          type: "object",
          properties: {
            originalUrl: { type: "string", format: "uri" },
            shortLink: { type: "string" },
          },
          required: ["originalUrl"],
        },
        response: {
          200: {
            type: "object",
            properties: { link: LinkSchema },
            required: ["link"],
          },
          400: ErrorSchema,
          409: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const body = (await request.body) as any;
      const originalUrl = body?.originalUrl;
      const shortLinkInput = body?.shortLink ?? body?.shortUrl;
      if (!originalUrl || !isValidUrl(originalUrl)) {
        return reply.code(400).send({ error: "URL inválida" });
      }
      if (shortLinkInput && !isValidShortLink(shortLinkInput)) {
        return reply.code(400).send({ error: "shortLink inválido" });
      }
      let shortLink: string;
      if (shortLinkInput) {
        const exists = await db
          .select({ id: links.id })
          .from(links)
          .where(eq(links.shortUrl, shortLinkInput))
          .limit(1);
        if (exists.length > 0) {
          return reply.code(409).send({ error: "shortLink já existente" });
        }
        shortLink = shortLinkInput;
      } else {
        shortLink = await generateUniqueShortLink();
      }
      const id = randomUUID();
      const now = new Date();
      const inserted = await db
        .insert(links)
        .values({
          id,
          originalUrl,
          shortUrl: shortLink,
          accessCount: 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return { link: mapLink(inserted[0]) };
    }
  );

  app.get(
    "/",
    {
      schema: {
        tags: ["Links"],
        summary: "Lista links",
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 200 },
            page: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              items: { type: "array", items: LinkSchema },
              limit: { type: "integer" },
              page: { type: "integer" },
              total: { type: "integer" },
            },
            required: ["items", "limit", "page", "total"],
          },
        },
      },
    },
    async (request) => {
      const q: any = request.query || {};
      const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 200);
      const page = Math.max(Number(q.page) || 1, 1);

      const totalRow = await db
        .select({ total: sql<number>`count(*)` })
        .from(links);
      const total = Number(totalRow[0]?.total || 0);

      const rows = await db
        .select()
        .from(links)
        .orderBy(desc(links.createdAt), desc(links.id))
        .limit(limit)
        .offset((page - 1) * limit);

      return { items: rows.map(mapLink), limit, page, total };
    }
  );

  app.get(
    "/:shortLink/original",
    {
      schema: {
        tags: ["Links"],
        summary: "Obtém URL original por shortLink",
        params: {
          type: "object",
          properties: { shortLink: { type: "string" } },
          required: ["shortLink"],
        },
        response: {
          200: {
            type: "object",
            properties: { originalUrl: { type: "string", format: "uri" } },
            required: ["originalUrl"],
          },
          400: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params: any = request.params || {};
      const shortLink = params.shortLink;
      if (!isValidShortLink(shortLink)) {
        return reply.code(400).send({ error: "shortLink inválido" });
      }
      const found = await db
        .select()
        .from(links)
        .where(eq(links.shortUrl, shortLink))
        .limit(1);
      if (found.length === 0) {
        return reply.code(404).send({ error: "Não encontrado" });
      }
      return { originalUrl: found[0].originalUrl };
    }
  );

  app.post(
    "/:shortLink/access",
    {
      schema: {
        tags: ["Links"],
        summary: "Incrementa contagem de acessos",
        params: {
          type: "object",
          properties: { shortLink: { type: "string" } },
          required: ["shortLink"],
        },
        response: {
          200: {
            type: "object",
            properties: { accessCount: { type: "integer" } },
            required: ["accessCount"],
          },
          400: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params: any = request.params || {};
      const shortLink = params.shortLink;
      if (!isValidShortLink(shortLink)) {
        return reply.code(400).send({ error: "shortLink inválido" });
      }
      const updated = await db
        .update(links)
        .set({
          accessCount: sql`${links.accessCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(links.shortUrl, shortLink))
        .returning();
      if (updated.length === 0) {
        return reply.code(404).send({ error: "Não encontrado" });
      }
      return { accessCount: updated[0].accessCount };
    }
  );

  app.put(
    "/:shortLink",
    {
      schema: {
        tags: ["Links"],
        summary: "Atualiza link encurtado",
        params: {
          type: "object",
          properties: { shortLink: { type: "string" } },
          required: ["shortLink"],
        },
        body: {
          type: "object",
          properties: {
            originalUrl: { type: "string", format: "uri" },
            shortLink: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: { link: LinkSchema },
            required: ["link"],
          },
          400: ErrorSchema,
          404: ErrorSchema,
          409: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params: any = request.params || {};
      const currentShortLink = params.shortLink;
      if (!isValidShortLink(currentShortLink)) {
        return reply.code(400).send({ error: "shortLink inválido" });
      }
      const body = (await request.body) as any;
      const nextOriginalUrl: string | undefined = body?.originalUrl;
      const nextShortUrl: string | undefined =
        body?.shortLink ?? body?.shortUrl;
      if (!nextOriginalUrl && !nextShortUrl) {
        return reply.code(400).send({ error: "Nenhum campo para atualizar" });
      }
      if (nextOriginalUrl && !isValidUrl(nextOriginalUrl)) {
        return reply.code(400).send({ error: "URL inválida" });
      }
      if (nextShortUrl && !isValidShortLink(nextShortUrl)) {
        return reply.code(400).send({ error: "shortLink inválido" });
      }
      const existing = await db
        .select()
        .from(links)
        .where(eq(links.shortUrl, currentShortLink))
        .limit(1);
      if (existing.length === 0) {
        return reply.code(404).send({ error: "Não encontrado" });
      }
      const current = existing[0];
      if (nextShortUrl && nextShortUrl !== current.shortUrl) {
        const collision = await db
          .select({ id: links.id })
          .from(links)
          .where(eq(links.shortUrl, nextShortUrl))
          .limit(1);
        if (collision.length > 0 && collision[0].id !== current.id) {
          return reply.code(409).send({ error: "shortLink já existente" });
        }
      }
      const values: any = { updatedAt: new Date() };
      if (nextOriginalUrl) values.originalUrl = nextOriginalUrl;
      if (nextShortUrl) values.shortUrl = nextShortUrl;
      const updated = await db
        .update(links)
        .set(values)
        .where(eq(links.id, current.id))
        .returning();
      return { link: mapLink(updated[0]) };
    }
  );

  app.delete(
    "/:shortLink",
    {
      schema: {
        tags: ["Links"],
        summary: "Deleta link encurtado",
        params: {
          type: "object",
          properties: { shortLink: { type: "string" } },
          required: ["shortLink"],
        },
        response: {
          200: {
            type: "object",
            properties: { ok: { type: "boolean" } },
            required: ["ok"],
          },
          400: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params: any = request.params || {};
      const shortLink = params.shortLink;
      if (!isValidShortLink(shortLink)) {
        return reply.code(400).send({ error: "shortLink inválido" });
      }
      const found = await db
        .select({ id: links.id })
        .from(links)
        .where(eq(links.shortUrl, shortLink))
        .limit(1);
      if (found.length === 0) {
        return reply.code(404).send({ error: "Não encontrado" });
      }
      await db.delete(links).where(eq(links.shortUrl, shortLink));
      return { ok: true };
    }
  );

  app.post(
    "/export",
    {
      schema: {
        tags: ["Links"],
        summary: "Exporta links para CSV e publica na CDN",
        response: {
          200: {
            type: "object",
            properties: {
              url: { type: "string", format: "uri" },
              key: { type: "string" },
            },
            required: ["url", "key"],
          },
        },
      },
    },
    async () => {
      const header = [
        "original_url",
        "short_url",
        "access_count",
        "created_at",
      ];
      let csv = header.join(",") + "\n";
      const pageSize = 1000;
      let cursor: string | null = null;
      while (true) {
        const limit = pageSize;
        let batch;
        if (!cursor) {
          batch = await db
            .select()
            .from(links)
            .orderBy(desc(links.createdAt), desc(links.id))
            .limit(limit);
        } else {
          const parts = cursor.split("|");
          const createdAtStr: string = parts[0];
          const cursorId: string = parts[1];
          const cDate = new Date(createdAtStr);
          batch = await db
            .select()
            .from(links)
            .where(
              or(
                lt(links.createdAt, cDate),
                and(eq(links.createdAt, cDate), lt(links.id, cursorId))
              )
            )
            .orderBy(desc(links.createdAt), desc(links.id))
            .limit(limit);
        }
        if (batch.length === 0) break;
        for (const r of batch) {
          const row = [
            toCsvValue(r.originalUrl),
            toCsvValue(r.shortUrl),
            toCsvValue(r.accessCount ?? 0),
            toCsvValue(r.createdAt?.toISOString() || ""),
          ].join(",");
          csv += row + "\n";
        }
        cursor = `${new Date(
          (batch[batch.length - 1].createdAt as any) || 0
        ).toISOString()}|${batch[batch.length - 1].id}`;
        if (batch.length < pageSize) break;
      }
      const result = await putCsvObject("exports", Buffer.from(csv, "utf8"));
      return { url: result.url, key: result.key };
    }
  );
}
