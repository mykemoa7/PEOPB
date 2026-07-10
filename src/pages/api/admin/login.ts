import type { APIRoute } from "astro";
import { SESSION_COOKIE, createSessionToken, verifyPassword } from "../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	const form = await request.formData();
	const password = String(form.get("password") ?? "");

	const valid = await verifyPassword(password);
	if (!valid) {
		return redirect("/admin/login?error=1");
	}

	cookies.set(SESSION_COOKIE, createSessionToken(), {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 7,
	});

	return redirect("/admin");
};
