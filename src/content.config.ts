import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		category: z.enum([
			"Technology",
			"AI",
			"Software Engineering",
			"Cloud",
			"Cybersecurity",
			"Digital Transformation",
			"Church Technology",
			"African Innovation",
		]),
		author: z.string().default("PEOPB"),
		draft: z.boolean().default(false),
	}),
});

export const collections = { blog };
