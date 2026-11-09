import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

const localBuckets = new Map<string, { start: number; count: number }>();
let productionHits = 0;

export async function hit(key: string, limit: number, windowMs: number) {
  if (process.env.NODE_ENV !== "production") {
    const now = Date.now();
    const old = localBuckets.get(key);
    if (!old || now - old.start >= windowMs) { localBuckets.set(key, { start: now, count: 1 }); return true; }
    if (old.count >= limit) return false;
    old.count++;
    return true;
  }

  const secret = process.env.OTP_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("OTP_SECRET must be at least 32 bytes for production rate limiting");
  const keyHash = createHmac("sha256", secret).update(key).digest("hex");
  const rows = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimitBucket" ("keyHash", "count", "windowExpiresAt", "updatedAt")
    VALUES (${keyHash}, 1, NOW() + (${windowMs} * INTERVAL '1 millisecond'), NOW())
    ON CONFLICT ("keyHash") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."windowExpiresAt" <= NOW() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "windowExpiresAt" = CASE WHEN "RateLimitBucket"."windowExpiresAt" <= NOW() THEN NOW() + (${windowMs} * INTERVAL '1 millisecond') ELSE "RateLimitBucket"."windowExpiresAt" END,
      "updatedAt" = NOW()
    RETURNING "count"
  `;
  productionHits++;
  if (productionHits % 100 === 0) await db.rateLimitBucket.deleteMany({ where: { windowExpiresAt: { lt: new Date() } } });
  return Number(rows[0]?.count ?? limit + 1) <= limit;
}
