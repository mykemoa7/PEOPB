const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; windowStart: number }>();

// In-memory, per-function-instance only: resets on cold start and isn't
// shared across concurrent Vercel instances. Still raises the bar
// meaningfully for a single-admin, low-traffic login endpoint without
// pulling in an external store.
export function isRateLimited(key: string): boolean {
	const now = Date.now();
	const entry = attempts.get(key);

	if (!entry || now - entry.windowStart > WINDOW_MS) {
		attempts.set(key, { count: 0, windowStart: now });
		return false;
	}

	return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
	const now = Date.now();
	const entry = attempts.get(key);

	if (!entry || now - entry.windowStart > WINDOW_MS) {
		attempts.set(key, { count: 1, windowStart: now });
		return;
	}

	entry.count += 1;
}

export function clearAttempts(key: string): void {
	attempts.delete(key);
}
