import { action, atom, onConnect, type Ctx } from "@reatom/framework";
import type { StorageModel, StorageState } from "../core";

export type StorageViewMode = "list" | "grid";
export type StorageSortKey = "name" | "size" | "date";
export type StorageSortDir = "asc" | "desc";
export type StorageSelectionMode = "immediate" | "confirm";

export type StorageLabels = {
	bucketsTitle: string;
	objectsTitle: (bucket: string, folder: string) => string;
	emptyBucket: string;
	emptyFolder: string;
	noBuckets: string;
	unavailable: string;
	back: string;
	close: string;
	search: string;
	clearSearch: string;
	sort: string;
	sortName: string;
	sortSize: string;
	sortDate: string;
	sortAsc: string;
	sortDesc: string;
	loadMore: string;
	retry: string;
	select: string;
	cancel: string;
	preview: string;
	closePreview: string;
	tree: string;
	noResults: string;
	listView: string;
	gridView: string;
};

export const defaultStorageLabels: StorageLabels = {
	bucketsTitle: "Buckets",
	objectsTitle: (bucket, folder) => `Objects in ${bucket}${folder ? `/${folder}` : ""}`,
	emptyBucket: "Bucket is empty",
	emptyFolder: "Folder is empty",
	noBuckets: "No buckets",
	unavailable: "Bucket unavailable",
	back: "Back",
	close: "Close",
	search: "Search",
	clearSearch: "Clear search",
	sort: "Sort",
	sortName: "Name",
	sortSize: "Size",
	sortDate: "Date",
	sortAsc: "Ascending",
	sortDesc: "Descending",
	loadMore: "Load more",
	retry: "Retry",
	select: "Select",
	cancel: "Cancel",
	preview: "Open preview",
	closePreview: "Close preview",
	tree: "Folders",
	noResults: "Nothing found",
	listView: "List",
	gridView: "Grid",
};

export type StorageBrowserOptions = {
	name: string;
	storage: StorageModel;
	storageState: StorageState;
	onSelectFile?: (ctx: Ctx, fileName: string) => void;
	labels?: Partial<StorageLabels>;
	formatDate?: (value: string, kind: "object" | "bucket") => string;
	/** Disable presigned thumbnails; file icons are shown instead. */
	previews?: boolean;
	/** `confirm` shows a selection footer instead of picking on click. */
	selectionMode?: StorageSelectionMode;
	defaultViewMode?: StorageViewMode;
	showTree?: boolean;
};

export const folderName = (prefix: string) => {
	const clean = prefix.replace(/\/$/, "");
	const index = clean.lastIndexOf("/");
	return index === -1 ? clean : clean.slice(index + 1);
};

const defaultFormatDate = (value: string, kind: "object" | "bucket") => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;

	return kind === "bucket"
		? date.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: date.toLocaleString(undefined, {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			});
};

const previewKey = (bucket: string, key: string) => `${bucket}/${key}`;

/**
 * Framework-agnostic view state shared by the React and Solid adapters.
 * Rendering lives in `@projectfasberry/storage/react` (or another binding);
 * filtering, sorting, selection and the preview lightbox live here.
 */
export const createStorageBrowser = ({
	name,
	storage,
	storageState,
	onSelectFile,
	labels: labelOverrides,
	formatDate = defaultFormatDate,
	previews = true,
	selectionMode = "immediate",
	defaultViewMode = "list",
	showTree = true,
}: StorageBrowserOptions) => {
	const labels = { ...defaultStorageLabels, ...labelOverrides };

	const search = atom("", `${name}.search`);
	const sort = atom<StorageSortKey>("name", `${name}.sort`);
	const sortDir = atom<StorageSortDir>("asc", `${name}.sortDir`);
	const viewMode = atom<StorageViewMode>(defaultViewMode, `${name}.viewMode`);
	const selected = atom<string | null>(null, `${name}.selected`);
	const lightbox = atom<string | null>(null, `${name}.lightbox`);
	const treeVisible = atom(showTree, `${name}.treeVisible`);

	const list = atom((ctx) => {
		const data = ctx.spy(storage.listObjects.dataAtom);
		const query = ctx.spy(search).trim().toLowerCase();
		const sortKey = ctx.spy(sort);
		const direction = ctx.spy(sortDir);
		const folders = (data?.commonPrefixes ?? [])
			.filter(({ prefix }) => !query || folderName(prefix).toLowerCase().includes(query))
			.map(({ prefix }) => prefix);
		const objects = (data?.contents ?? []).filter((object) => !query || object.key.toLowerCase().includes(query));

		const compare = (a: string, b: string) => {
			const result = a.localeCompare(b, undefined, { numeric: true });
			return direction === "asc" ? result : -result;
		};

		folders.sort((a, b) => compare(folderName(a), folderName(b)));
		objects.sort((a, b) => {
			const result =
				sortKey === "size"
					? (a.size ?? 0) - (b.size ?? 0)
					: sortKey === "date"
						? new Date(a.lastModified ?? 0).getTime() - new Date(b.lastModified ?? 0).getTime()
						: a.key.localeCompare(b.key, undefined, { numeric: true });

			return direction === "asc" ? result : -result;
		});

		return { folders, objects };
	}, `${name}.list`);

	onConnect(lightbox, (ctx) => {
		if (typeof window === "undefined") return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && ctx.get(lightbox)) {
				lightbox(ctx, null);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	});

	const actions = {
		setSearch: action((ctx, value: string) => search(ctx, value), `${name}.setSearch`),
		setSort: action((ctx, value: StorageSortKey) => sort(ctx, value), `${name}.setSort`),
		toggleSortDir: action((ctx) => sortDir(ctx, ctx.get(sortDir) === "asc" ? "desc" : "asc"), `${name}.toggleSortDir`),
		toggleViewMode: action(
			(ctx) => viewMode(ctx, ctx.get(viewMode) === "list" ? "grid" : "list"),
			`${name}.toggleViewMode`,
		),
		toggleTreeVisible: action((ctx) => treeVisible(ctx, !ctx.get(treeVisible)), `${name}.toggleTreeVisible`),
		selectObject: action((ctx, key: string) => {
			if (selectionMode === "immediate") {
				onSelectFile?.(ctx, key);
				storageState.isOpen(ctx, false);
				return;
			}

			selected(ctx, ctx.get(selected) === key ? null : key);
		}, `${name}.selectObject`),
		clearSelection: action((ctx) => selected(ctx, null), `${name}.clearSelection`),
		confirmSelection: action((ctx) => {
			const key = ctx.get(selected);
			if (!key) return;

			onSelectFile?.(ctx, key);
			storageState.isOpen(ctx, false);
		}, `${name}.confirmSelection`),
		openPreview: action((ctx, params: { bucket: string; key: string }) => {
			const url = ctx.get(storage.previews)[previewKey(params.bucket, params.key)];
			if (url) {
				lightbox(ctx, url);
				return;
			}
			if (previews) storage.loadPreview(ctx, params);
		}, `${name}.openPreview`),
		closePreview: action((ctx) => lightbox(ctx, null), `${name}.closePreview`),
	};

	return {
		labels,
		formatDate,
		previews,
		selectionMode,
		onSelectFile,
		search,
		sort,
		sortDir,
		viewMode,
		selected,
		lightbox,
		treeVisible,
		list,
		actions,
	};
};

export type StorageBrowser = ReturnType<typeof createStorageBrowser>;
