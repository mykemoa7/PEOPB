import type { APIRoute } from "astro";
import { publishPost } from "../../../lib/github";

export const prerender = false;

const CATEGORIES = new Set([
	"Technology",
	"AI",
	"Software Engineering",
	"Cloud",
	"Cybersecurity",
	"Digital Transformation",
	"Church Technology",
	"African Innovation",
]);

function slugify(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export const POST: APIRoute = async ({ request }) => {
	const form = await request.formData();
	const title = String(form.get("title") ?? "").trim();
	const description = String(form.get("description") ?? "").trim();
	const category = String(form.get("category") ?? "");
	const body = String(form.get("body") ?? "").trim();
	const draft = form.get("draft") === "on";

	if (!title || !description || !body || !CATEGORIES.has(category)) {
		return new Response(JSON.stringify({ error: "Missing or invalid fields" }), { status: 400 });
	}

	const slug = slugify(title);
	if (!slug) {
		return new Response(JSON.stringify({ error: "Title produced an empty slug" }), { status: 400 });
	}

	let result;
	try {
		result = await publishPost({
			slug,
			frontmatter: {
				title,
				description,
				pubDate: new Date().toISOString().slice(0, 10),
				category,
				author: "PEOPB",
				draft,
			},
			body,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return new Response(
			JSON.stringify({ error: `Publishing isn't configured yet: ${message}` }),
			{ status: 503 }
		);
	}

	if (!result.ok) {
		return new Response(JSON.stringify({ error: result.error }), { status: 502 });
	}

	return new Response(JSON.stringify({ ok: true, slug }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
