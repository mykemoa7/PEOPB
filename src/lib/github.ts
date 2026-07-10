interface PublishPostInput {
	slug: string;
	frontmatter: {
		title: string;
		description: string;
		pubDate: string;
		category: string;
		author: string;
		draft: boolean;
	};
	body: string;
}

interface PublishResult {
	ok: boolean;
	error?: string;
}

function requireEnv(name: string): string {
	const value = import.meta.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}

function toFrontmatterYaml(fm: PublishPostInput["frontmatter"]): string {
	const escape = (s: string) => s.replace(/"/g, '\\"');
	return [
		"---",
		`title: "${escape(fm.title)}"`,
		`description: "${escape(fm.description)}"`,
		`pubDate: ${fm.pubDate}`,
		`category: "${escape(fm.category)}"`,
		`author: "${escape(fm.author)}"`,
		`draft: ${fm.draft}`,
		"---",
		"",
	].join("\n");
}

export async function publishPost(input: PublishPostInput): Promise<PublishResult> {
	const token = requireEnv("GITHUB_TOKEN");
	const repo = requireEnv("GITHUB_REPO"); // "owner/repo"
	const branch = import.meta.env.GITHUB_BRANCH || "main";

	const path = `src/content/blog/${input.slug}.md`;
	const content = toFrontmatterYaml(input.frontmatter) + input.body;
	const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

	const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
	const headers = {
		Authorization: `Bearer ${token}`,
		Accept: "application/vnd.github+json",
		"Content-Type": "application/json",
	};

	// Check if the file already exists, to include its sha (required to update).
	let sha: string | undefined;
	const existing = await fetch(`${apiUrl}?ref=${branch}`, { headers });
	if (existing.ok) {
		const data = (await existing.json()) as { sha: string };
		sha = data.sha;
	} else if (existing.status !== 404) {
		return { ok: false, error: `Failed to check existing file (${existing.status})` };
	}

	const response = await fetch(apiUrl, {
		method: "PUT",
		headers,
		body: JSON.stringify({
			message: sha ? `Update post: ${input.frontmatter.title}` : `New post: ${input.frontmatter.title}`,
			content: contentBase64,
			branch,
			...(sha ? { sha } : {}),
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		return { ok: false, error: `GitHub API error (${response.status}): ${body}` };
	}

	return { ok: true };
}
