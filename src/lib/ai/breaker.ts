// Per-provider circuit breaker (in-memory).
// Server-only. Process-local; resets on restart.

type State = "closed" | "open" | "half";

interface Stat {
  state: State;
  failures: number;
  successes: number;
  windowStart: number;
  openedAt: number;
}

const WINDOW_MS = 60_000;
const MIN_REQUESTS = 10;
const ERROR_THRESHOLD = 0.4; // 40 %
const OPEN_MS = 30_000;

const stats = new Map<string, Stat>();

function get(key: string): Stat {
  let s = stats.get(key);
  if (!s) {
    s = { state: "closed", failures: 0, successes: 0, windowStart: Date.now(), openedAt: 0 };
    stats.set(key, s);
  }
  // Roll window.
  if (Date.now() - s.windowStart > WINDOW_MS) {
    s.windowStart = Date.now();
    s.failures = 0;
    s.successes = 0;
  }
  return s;
}

export function canRequest(provider: string): boolean {
  const s = get(provider);
  if (s.state === "open") {
    if (Date.now() - s.openedAt >= OPEN_MS) {
      s.state = "half";
      return true;
    }
    return false;
  }
  return true;
}

export function recordSuccess(provider: string): void {
  const s = get(provider);
  s.successes += 1;
  if (s.state === "half") s.state = "closed";
}

export function recordFailure(provider: string): void {
  const s = get(provider);
  s.failures += 1;
  if (s.state === "half") {
    s.state = "open";
    s.openedAt = Date.now();
    return;
  }
  const total = s.failures + s.successes;
  if (total >= MIN_REQUESTS && s.failures / total >= ERROR_THRESHOLD) {
    s.state = "open";
    s.openedAt = Date.now();
  }
}

export function snapshot() {
  return Object.fromEntries(stats);
}
