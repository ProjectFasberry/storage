import type { StorageApi, StorageObjectPage } from "../core";

const object = (key: string, size = 1024) => ({
	key,
	size,
	lastModified: "2024-05-01T10:00:00.000Z",
});

const FOLDERS: Record<string, string[]> = {
	"": ["docs/", "images/"],
	"docs/": ["docs/guides/"],
	"docs/guides/": [],
	"images/": [],
};

const OBJECTS: Record<string, ReturnType<typeof object>[]> = {
	"": [object("readme.md")],
	"docs/": [object("docs/intro.md")],
	"docs/guides/": [object("docs/guides/setup.md")],
	"images/": [object("images/logo.png", 2048)],
};

/**
 * In-memory S3-like API: enough shape for the model, no network and no timers.
 */
export const createFakeStorageApi = (): StorageApi => ({
	listBuckets: async () => [
		{ name: "media", creationDate: "2024-01-01T00:00:00.000Z" },
		{ name: "broken", creationDate: "2024-02-01T00:00:00.000Z", available: false },
	],
	getBucket: async (bucket: string) => ({ name: bucket }),
	listObjects: async (bucket: string, options): Promise<StorageObjectPage> => {
		if (bucket === "broken") throw new Error("bucket unavailable");

		const folder = options?.folder ?? "";
		return {
			contents: OBJECTS[folder] ?? [],
			commonPrefixes: (FOLDERS[folder] ?? []).map((prefix) => ({ prefix })),
		};
	},
	presign: async (bucket: string, key: string) => `https://cdn.test/${bucket}/${key}`,
});
