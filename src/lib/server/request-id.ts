// Request-ID helper. Reads inbound X-Request-Id if present, else mints v7-ish.
// Server-only.

export function getOrMintRequestId(headers: Headers): string {
  const incoming = headers.get("x-request-id");
  if (incoming && /^[A-Za-z0-9._:-]{6,128}$/.test(incoming)) return incoming;
  // UUID v4 (sufficient for log correlation; no extra dep).
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const REQUEST_ID_HEADER = "X-Request-Id";
