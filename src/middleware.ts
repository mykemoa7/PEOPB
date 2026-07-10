import { defineMiddleware } from "astro:middleware";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/login"]);

export const onRequest = defineMiddleware((context, next) => {
	const { pathname } = context.url;

	const isProtected =
		(pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
		!PUBLIC_ADMIN_PATHS.has(pathname);

	if (!isProtected) {
		return next();
	}

	const token = context.cookies.get(SESSION_COOKIE)?.value;
	if (!verifySessionToken(token)) {
		return pathname.startsWith("/api/")
			? new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
			: context.redirect("/admin/login");
	}

	return next();
});
