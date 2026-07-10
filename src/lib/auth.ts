import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const SESSION_COOKIE = "peopb_admin_session";

function sign(value: string, secret: string): string {
	return createHmac("sha256", secret).update(value).digest("hex");
}

// Stored base64-encoded rather than as a raw bcrypt hash: the hash's own "$"
// characters (e.g. "$2b$10$...") are indistinguishable from shell/dotenv
// variable-expansion syntax to some .env loaders, which silently corrupts
// the value. Base64 has no "$", sidestepping the whole problem.
export async function verifyPassword(password: string): Promise<boolean> {
	const encoded = import.meta.env.ADMIN_PASSWORD_HASH_B64;
	if (!encoded) return false;
	const hash = Buffer.from(encoded, "base64").toString("utf-8");
	return bcrypt.compare(password, hash);
}

export function createSessionToken(): string {
	const secret = import.meta.env.SESSION_SECRET;
	if (!secret) throw new Error("SESSION_SECRET is not set");
	const expires = Date.now() + SESSION_MAX_AGE_MS;
	const payload = `${expires}`;
	const signature = sign(payload, secret);
	return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
	const secret = import.meta.env.SESSION_SECRET;
	if (!token || !secret) return false;

	const [payload, signature] = token.split(".");
	if (!payload || !signature) return false;

	const expected = sign(payload, secret);
	const sigBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(expected);
	if (sigBuffer.length !== expectedBuffer.length) return false;
	if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false;

	const expires = Number(payload);
	if (Number.isNaN(expires) || Date.now() > expires) return false;

	return true;
}
