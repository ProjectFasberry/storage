import { createCtx } from "@reatom/framework";
import { reatomContext } from "@reatom/npm-react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { createStorageModel } from "../core";
import { createFakeStorageApi } from "../test/fake-api";
import { createStorageView, type StorageViewOptions } from ".";

const setup = (options: Partial<StorageViewOptions> = {}) => {
	const ctx = createCtx();
	const { storage, storageState } = createStorageModel({ name: "test", api: createFakeStorageApi() });
	const { StorageContent } = createStorageView({
		name: "test",
		storage,
		storageState,
		...options,
	});

	const result = render(
		<reatomContext.Provider value={ctx}>
			<StorageContent />
		</reatomContext.Provider>,
	);

	return { ctx, storage, storageState, user: userEvent.setup(), ...result };
};

const openMediaBucket = async (options: Partial<StorageViewOptions> = {}) => {
	const context = setup(options);
	const bucket = await context.findByRole("button", { name: /media/ });
	await context.user.click(bucket);
	const tree = await context.findByRole("tree", { name: "Folders" });

	return { ...context, tree };
};

describe("storage browser accessibility", () => {
	it("renders the bucket list without axe violations", async () => {
		const { container, findByRole } = setup();

		await findByRole("button", { name: /media/ });

		expect(await axe(container)).toHaveNoViolations();
	});

	it("exposes the folder tree as an ARIA tree", async () => {
		const { tree, container } = await openMediaBucket();
		const items = within(tree).getAllByRole("treeitem");

		expect(items).toHaveLength(3);
		expect(items[0]).toHaveAttribute("aria-expanded", "true");
		expect(items[1]).toHaveAttribute("aria-level", "2");
		expect(items[1]).toHaveAttribute("aria-expanded", "false");
		expect(items[0]).toHaveAttribute("tabindex", "0");
		expect(items[1]).toHaveAttribute("tabindex", "-1");

		expect(await axe(container)).toHaveNoViolations();
	});

	it("navigates the tree with the keyboard only", async () => {
		const { tree, user } = await openMediaBucket();
		const items = within(tree).getAllByRole("treeitem");

		items[0].focus();
		expect(items[0]).toHaveFocus();

		await user.keyboard("{ArrowDown}");
		expect(items[1]).toHaveFocus();

		await user.keyboard("{ArrowRight}");
		await waitFor(() => expect(within(tree).getAllByRole("treeitem")).toHaveLength(4));

		await user.keyboard("{ArrowDown}");
		expect(within(tree).getAllByRole("treeitem")[2]).toHaveFocus();

		await user.keyboard("{Enter}");
		expect(await screen.findByText("docs/guides/setup.md")).toBeInTheDocument();

		await user.keyboard("{ArrowLeft}");
		expect(within(tree).getAllByRole("treeitem")[1]).toHaveFocus();

		await user.keyboard("{ArrowLeft}");
		await waitFor(() => expect(within(tree).getAllByRole("treeitem")).toHaveLength(3));

		await user.keyboard("{End}");
		expect(within(tree).getAllByRole("treeitem")[2]).toHaveFocus();

		await user.keyboard("{Home}");
		expect(within(tree).getAllByRole("treeitem")[0]).toHaveFocus();
	});
});
