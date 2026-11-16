import { createCtx } from "@reatom/framework";
import { describe, expect, it } from "vitest";
import { createStorageModel } from "../core";
import { createFakeStorageApi } from "../test/fake-api";
import { createStorageBrowser, type StorageBrowserOptions } from ".";

const setup = (options: Partial<StorageBrowserOptions> = {}) => {
	const ctx = createCtx();
	const { storage, storageState } = createStorageModel({ name: "headless", api: createFakeStorageApi() });
	const browser = createStorageBrowser({
		name: "headless",
		storage,
		storageState,
		...options,
	});

	return { ctx, storage, storageState, browser };
};

const openBucket = async ({ ctx, storage, browser }: ReturnType<typeof setup>) => {
	await storage.listBuckets(ctx);
	storage.selectBucket(ctx, "media");
	await storage.listObjects(ctx, { bucket: "media", folder: "" });
	await storage.fetchTree(ctx, "");
	return browser;
};

describe("tree navigation state", () => {
	it("flattens only the visible rows and walks them with arrow keys", async () => {
		const context = setup();
		await openBucket(context);
		const { ctx, browser } = context;

		expect(ctx.get(browser.treeRows).map((row) => row.prefix)).toEqual(["", "docs/", "images/"]);

		browser.actions.onTreeKeyDown(ctx, "ArrowDown");
		expect(ctx.get(browser.treeFocus)).toBe("docs/");

		browser.actions.onTreeKeyDown(ctx, "ArrowRight");
		await context.storage.fetchTree(ctx, "docs/");
		expect(ctx.get(browser.treeRows).map((row) => row.prefix)).toEqual(["", "docs/", "docs/guides/", "images/"]);

		browser.actions.onTreeKeyDown(ctx, "ArrowDown");
		expect(ctx.get(browser.treeFocus)).toBe("docs/guides/");

		browser.actions.onTreeKeyDown(ctx, "ArrowLeft");
		expect(ctx.get(browser.treeFocus)).toBe("docs/");

		browser.actions.onTreeKeyDown(ctx, "ArrowLeft");
		expect(ctx.get(browser.treeRows)).toHaveLength(3);
		expect(ctx.get(browser.treeFocus)).toBe("docs/");
	});

	it("opens the focused folder on Enter", async () => {
		const context = setup();
		await openBucket(context);
		const { ctx, browser, storageState } = context;

		browser.actions.onTreeKeyDown(ctx, "ArrowDown");
		browser.actions.onTreeKeyDown(ctx, "Enter");
		await context.storage.listObjects(ctx, { bucket: "media", folder: "docs/" });

		expect(ctx.get(storageState.folder)).toBe("docs/");
	});
});

describe("multi-select", () => {
	it("forces confirm mode and collects keys up to maxSelected", () => {
		const picked: string[][] = [];
		const { ctx, browser } = setup({
			multiple: true,
			maxSelected: 2,
			onSelectFiles: (_ctx, keys) => picked.push(keys),
		});

		expect(browser.selectionMode).toBe("confirm");

		browser.actions.selectObject(ctx, "media/a.png");
		browser.actions.selectObject(ctx, "media/b.png");
		browser.actions.selectObject(ctx, "media/c.png");

		expect(ctx.get(browser.selected)).toEqual(["media/a.png", "media/b.png"]);

		browser.actions.selectObject(ctx, "media/a.png");
		expect(ctx.get(browser.selected)).toEqual(["media/b.png"]);

		browser.actions.confirmSelection(ctx);
		expect(picked).toEqual([["media/b.png"]]);
	});

	it("keeps a single key without multiple", () => {
		const { ctx, browser } = setup({ selectionMode: "confirm" });

		browser.actions.selectObject(ctx, "media/a.png");
		browser.actions.selectObject(ctx, "media/b.png");
		expect(ctx.get(browser.selected)).toEqual(["media/b.png"]);

		browser.actions.selectObject(ctx, "media/b.png");
		expect(ctx.get(browser.selected)).toEqual([]);
	});

	it("clears the selection when the panel closes", () => {
		const { ctx, browser, storageState } = setup({ multiple: true });

		// `onConnect` runs once the atom has a subscriber, as it does in the view.
		const unsubscribe = ctx.subscribe(storageState.isOpen, () => {});

		storageState.isOpen(ctx, true);
		browser.actions.selectObject(ctx, "media/a.png");
		expect(ctx.get(browser.selected)).toHaveLength(1);

		storageState.isOpen(ctx, false);
		expect(ctx.get(browser.selected)).toEqual([]);
		unsubscribe();
	});
});
