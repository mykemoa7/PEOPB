import type { APIRoute } from "astro";
import { SESSION_COOKIE, createSessionToken, verifyPassword } from "../../../lib/auth";
import { clearAttempts, isRateLimited, recordFailedAttempt } from "../../../lib/rateLimit";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress }) => {
	const key = clientAddress ?? "unknown";

	if (isRateLimited(key)) {
		return redirect("/admin/login?error=2");
	}

	const form = await request.formData();
	const password = String(form.get("password") ?? "");

	const valid = await verifyPassword(password);
	if (!valid) {
		recordFailedAttempt(key);
		return redirect("/admin/login?error=1");
	}

	clearAttempts(key);

	cookies.set(SESSION_COOKIE, createSessionToken(), {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 7,
	});

	return redirect("/admin");
};
