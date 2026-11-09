import { NextRequest } from "next/server";

export async function readJson(req: NextRequest, maxBytes = 16 * 1024): Promise<unknown | null> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes || !req.body) return null;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(body));
  } catch { return null; }
}
