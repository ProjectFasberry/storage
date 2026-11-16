import { atom, type CtxSpy } from "@reatom/framework";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import type { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import type { StorageObject, StorageTreeEntry } from "../core";
import {
	createStorageBrowser,
	defaultStorageLabels,
	folderName,
	type StorageBrowserOptions,
	type StorageLabels,
	type StorageSortKey,
	type StorageViewMode,
} from "../headless";

export { defaultStorageLabels };
export type { StorageLabels, StorageViewMode };

type FileKind = "image" | "text" | "code" | "archive" | "audio" | "video" | "other";

export type StorageViewOptions = StorageBrowserOptions & {
	className?: string;
};

const formatBytes = (value?: number) => {
	if (value === undefined || value === null) return "—";

	const units = ["B", "KB", "MB", "GB", "TB"];
	let size = value;
	let unit = 0;

	while (size >= 1024 && unit < units.length - 1) {
		size /= 1024;
		unit++;
	}

	return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const IMAGE_RE = /\.(png|jpe?g|webp|gif|avif|bmp|ico)$/i;
const TEXT_RE = /\.(txt|md|markdown|log|csv|tsv|json|ya?ml|toml|ini|conf|env)$/i;
const CODE_RE = /\.(ts|tsx|js|jsx|mjs|cjs|py|rs|go|java|kt|kts|sh|bash|zsh|sql|html?|css|scss|less|xml|svg)$/i;
const ARCHIVE_RE = /\.(zip|tar|gz|tgz|bz2|xz|7z|rar)$/i;
const AUDIO_RE = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|avi|mkv|m4v)$/i;

const fileKind = (key: string): FileKind => {
	if (IMAGE_RE.test(key)) return "image";
	if (TEXT_RE.test(key)) return "text";
	if (CODE_RE.test(key)) return "code";
	if (ARCHIVE_RE.test(key)) return "archive";
	if (AUDIO_RE.test(key)) return "audio";
	if (VIDEO_RE.test(key)) return "video";
	return "other";
};

type IconName =
	| "folder"
	| "file"
	| "image"
	| "text"
	| "code"
	| "archive"
	| "audio"
	| "video"
	| "chevron"
	| "search"
	| "close"
	| "arrow-left"
	| "tree"
	| "grid"
	| "list"
	| "eye"
	| "retry";

const StorageIconSprite = () => (
	<svg aria-hidden="true" style={{ display: "none" }}>
		<symbol id="storage-icon-folder" viewBox="0 0 24 24">
			<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
		</symbol>
		<symbol id="storage-icon-file" viewBox="0 0 24 24">
			<path d="M6 3h8l4 4v14H6V3Z" />
			<path d="M14 3v5h5" />
		</symbol>
		<symbol id="storage-icon-image" viewBox="0 0 24 24">
			<rect x="3" y="4" width="18" height="16" rx="2" />
			<circle cx="8.5" cy="9.5" r="1.5" />
			<path d="m21 15-5-5L5 21" />
		</symbol>
		<symbol id="storage-icon-text" viewBox="0 0 24 24">
			<path d="M6 3h8l4 4v14H6V3Z" />
			<path d="M9 12h6M9 16h6M9 8h3" />
		</symbol>
		<symbol id="storage-icon-code" viewBox="0 0 24 24">
			<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
		</symbol>
		<symbol id="storage-icon-archive" viewBox="0 0 24 24">
			<path d="M4 7h16v13H4V7ZM3 4h18v3H3V4Z" />
			<path d="M10 11h4" />
		</symbol>
		<symbol id="storage-icon-audio" viewBox="0 0 24 24">
			<path d="M9 18V6l10-2v12" />
			<circle cx="6" cy="18" r="3" />
			<circle cx="16" cy="16" r="3" />
		</symbol>
		<symbol id="storage-icon-video" viewBox="0 0 24 24">
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="m10 9 5 3-5 3V9Z" />
		</symbol>
		<symbol id="storage-icon-chevron" viewBox="0 0 24 24">
			<path d="m9 6 6 6-6 6" />
		</symbol>
		<symbol id="storage-icon-search" viewBox="0 0 24 24">
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-4-4" />
		</symbol>
		<symbol id="storage-icon-close" viewBox="0 0 24 24">
			<path d="m6 6 12 12M18 6 6 18" />
		</symbol>
		<symbol id="storage-icon-arrow-left" viewBox="0 0 24 24">
			<path d="M19 12H5M11 18l-6-6 6-6" />
		</symbol>
		<symbol id="storage-icon-tree" viewBox="0 0 24 24">
			<path d="M5 4v16M5 8h6M5 16h6M11 6v4M11 14v4" />
			<rect x="16" y="4" width="4" height="4" rx="1" />
			<rect x="16" y="10" width="4" height="4" rx="1" />
			<rect x="16" y="16" width="4" height="4" rx="1" />
		</symbol>
		<symbol id="storage-icon-grid" viewBox="0 0 24 24">
			<rect x="3" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="3" width="7" height="7" rx="1" />
			<rect x="3" y="14" width="7" height="7" rx="1" />
			<rect x="14" y="14" width="7" height="7" rx="1" />
		</symbol>
		<symbol id="storage-icon-list" viewBox="0 0 24 24">
			<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
		</symbol>
		<symbol id="storage-icon-eye" viewBox="0 0 24 24">
			<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
			<circle cx="12" cy="12" r="3" />
		</symbol>
		<symbol id="storage-icon-retry" viewBox="0 0 24 24">
			<path d="M20 11a8 8 0 1 0-2.3 5.7" />
			<path d="M20 4v7h-7" />
		</symbol>
	</svg>
);

const Icon = ({ name, className = "size-4" }: { name: IconName; className?: string }) => (
	<svg
		aria-hidden="true"
		focusable="false"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.5}
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<use href={`#storage-icon-${name}`} />
	</svg>
);

const FolderIcon = ({ className = "size-4" }: { className?: string }) => <Icon name="folder" className={className} />;

const FileIcon = ({ className = "size-4" }: { className?: string }) => <Icon name="file" className={className} />;

const ImageIcon = ({ className = "size-4" }: { className?: string }) => <Icon name="image" className={className} />;

const TextIcon = ({ className = "size-4" }: { className?: string }) => <Icon name="text" className={className} />;

const CodeIcon = ({ className = "size-4" }: { className?: string }) => <Icon name="code" className={className} />;

const ArchiveIcon = ({ className = "size-4" }: { className?: string }) => <Icon name="archive" className={className} />;

const AudioIcon = ({ className = "size-4" }: { className?: string }) => <Icon name="audio" className={className} />;

const VideoIcon = ({ className = "size-4" }: { className?: string }) => <Icon name="video" className={className} />;

const KindIcon = ({ kind, className }: { kind: FileKind; className?: string }) => {
	switch (kind) {
		case "image":
			return <ImageIcon className={className} />;
		case "text":
			return <TextIcon className={className} />;
		case "code":
			return <CodeIcon className={className} />;
		case "archive":
			return <ArchiveIcon className={className} />;
		case "audio":
			return <AudioIcon className={className} />;
		case "video":
			return <VideoIcon className={className} />;
		default:
			return <FileIcon className={className} />;
	}
};

const ChevronIcon = ({ open }: { open: boolean }) => (
	<Icon name="chevron" className={`size-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
);

const SearchIcon = () => <Icon name="search" className="size-3.5" />;

const CloseIcon = ({ className = "size-3.5" }: { className?: string }) => <Icon name="close" className={className} />;

const ArrowLeftIcon = () => <Icon name="arrow-left" />;

const TreeIcon = () => <Icon name="tree" />;

const GridIcon = () => <Icon name="grid" />;

const ListIcon = () => <Icon name="list" />;

const EyeIcon = () => <Icon name="eye" />;

const RetryIcon = () => <Icon name="retry" />;

const Skeleton = ({ className }: { className?: string }) => (
	<div className={`animate-pulse rounded bg-neutral-800 ${className ?? ""}`} />
);

const Noop = ({ title }: { title: string }) => <span className="text-sm leading-4 text-neutral-500">{title}</span>;

const ErrorBlock = ({ title, onRetry, labels }: { title: string; onRetry: () => void; labels: StorageLabels }) => (
	<div role="alert" aria-live="assertive" className="flex max-w-2xl flex-col gap-2 rounded-lg bg-red-500/20 px-4 py-3">
		<span className="text-sm font-semibold leading-5 text-red-300">{title}</span>
		<button
			type="button"
			onClick={onRetry}
			className="inline-flex w-fit items-center gap-1 rounded-lg bg-neutral-900/60 px-2 py-1 text-xs text-neutral-100 hover:bg-neutral-900"
		>
			<RetryIcon />
			{labels.retry}
		</button>
	</div>
);

const Spinner = () => (
	<span className="size-3.5 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200" />
);

const BackButton = ({ onClick, label, close }: { onClick: () => void; label: string; close: boolean }) => (
	<button
		type="button"
		aria-label={label}
		onClick={onClick}
		className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-neutral-50"
	>
		{close ? <CloseIcon className="size-4" /> : <ArrowLeftIcon />}
	</button>
);

const RowButton = ({
	onClick,
	children,
	className = "",
	selected = false,
}: {
	onClick: () => void;
	children: ReactNode;
	className?: string;
	selected?: boolean;
}) => (
	<button
		type="button"
		aria-pressed={selected}
		onClick={onClick}
		className={`text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
			selected ? "ring-1 ring-neutral-400" : ""
		} ${className}`}
	>
		{children}
	</button>
);

export function createStorageView(options: StorageViewOptions) {
	const { name, storage, storageState, className, showTree = true } = options;
	const browser = createStorageBrowser(options);
	const { labels, formatDate, previews: previewsEnabled, selectionMode } = browser;

	const storageTitleAtom = atom((ctx: CtxSpy) => {
		const section = ctx.spy(storageState.section);
		const folder = ctx.spy(storageState.folder);

		if (section === "buckets-list") return labels.bucketsTitle;

		return labels.objectsTitle(ctx.spy(storageState.bucket) ?? "", folder);
	}, `${name}.storageTitle`);

	const StorageListSkeleton = () => (
		<div className="flex w-full flex-col gap-1">
			{["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
				<Skeleton key={key} className="h-8 w-full" />
			))}
		</div>
	);

	const LazyPreview = reatomComponent<{
		bucket: string;
		objectKey: string;
		className?: string;
	}>(({ ctx, bucket, objectKey, className: previewClassName }) => {
		const preview = ctx.spy(storage.previews)[`${bucket}/${objectKey}`];

		useUpdate(
			(loadCtx) => {
				if (previewsEnabled && !preview) {
					storage.loadPreview(loadCtx, { bucket, key: objectKey });
				}
			},
			[preview],
		);

		return (
			<div
				className={`flex shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-900 text-neutral-500 ${previewClassName ?? ""}`}
			>
				{preview ? <img src={preview} alt="" className="size-full object-cover" /> : <ImageIcon className="size-4" />}
			</div>
		);
	}, `${name}.LazyPreview`);

	const Breadcrumbs = reatomComponent(({ ctx }) => {
		const bucket = ctx.spy(storageState.bucket);
		const folder = ctx.spy(storageState.folder);
		const parts = folder.split("/").filter(Boolean);

		return (
			<div className="flex min-w-0 items-center gap-1 overflow-hidden text-xs text-neutral-400">
				<button
					type="button"
					onClick={() => storageState.section(ctx, "buckets-list")}
					className="shrink-0 hover:text-neutral-100"
				>
					{labels.bucketsTitle}
				</button>
				<span className="shrink-0">/</span>
				<button
					type="button"
					onClick={() => storage.openFolder(ctx, "")}
					className="shrink-0 truncate hover:text-neutral-100"
				>
					{bucket}
				</button>
				{parts.map((part, index) => {
					const prefix = `${parts.slice(0, index + 1).join("/")}/`;
					const isLast = index === parts.length - 1;

					return (
						<span key={prefix} className="flex min-w-0 items-center gap-1">
							<span className="shrink-0">/</span>
							{isLast ? (
								<span className="truncate text-neutral-200">{part}</span>
							) : (
								<button
									type="button"
									onClick={() => storage.openFolder(ctx, prefix)}
									className="truncate hover:text-neutral-100"
								>
									{part}
								</button>
							)}
						</span>
					);
				})}
			</div>
		);
	}, `${name}.Breadcrumbs`);

	const StorageToolbar = reatomComponent(({ ctx }) => {
		const search = ctx.spy(browser.search);
		const sort = ctx.spy(browser.sort);
		const sortDir = ctx.spy(browser.sortDir);
		const viewMode = ctx.spy(browser.viewMode);

		return (
			<div className="flex w-full flex-wrap items-center gap-1">
				<div className="relative min-w-40 flex-1">
					<span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500">
						<SearchIcon />
					</span>
					<input
						value={search}
						onChange={(event) => browser.actions.setSearch(ctx, event.target.value)}
						placeholder={labels.search}
						aria-label={labels.search}
						className="h-8 w-full rounded-lg border border-neutral-800 bg-neutral-800 pl-7 pr-7 text-xs text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600"
					/>
					{search ? (
						<button
							type="button"
							aria-label={labels.clearSearch}
							onClick={() => browser.actions.setSearch(ctx, "")}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200"
						>
							<CloseIcon />
						</button>
					) : null}
				</div>
				<label className="flex items-center gap-1 text-xs text-neutral-500">
					<span className="sr-only">{labels.sort}</span>
					<select
						value={sort}
						onChange={(event) => browser.actions.setSort(ctx, event.target.value as StorageSortKey)}
						className="h-8 rounded-lg border border-neutral-800 bg-neutral-800 px-1 text-xs text-neutral-100 outline-none focus:border-neutral-600"
					>
						<option value="name">{labels.sortName}</option>
						<option value="size">{labels.sortSize}</option>
						<option value="date">{labels.sortDate}</option>
					</select>
				</label>
				<button
					type="button"
					aria-label={sortDir === "asc" ? labels.sortAsc : labels.sortDesc}
					onClick={() => browser.actions.toggleSortDir(ctx)}
					className="flex size-8 items-center justify-center rounded-lg bg-neutral-800 text-xs text-neutral-200 hover:bg-neutral-700"
				>
					{sortDir === "asc" ? "↑" : "↓"}
				</button>
				<button
					type="button"
					aria-label={viewMode === "list" ? labels.gridView : labels.listView}
					onClick={() => browser.actions.toggleViewMode(ctx)}
					className="flex size-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
				>
					{viewMode === "list" ? <GridIcon /> : <ListIcon />}
				</button>
			</div>
		);
	}, `${name}.StorageToolbar`);

	const StorageObjectItem = reatomComponent<{
		bucket: string;
		object: StorageObject;
		mode: StorageViewMode;
	}>(({ ctx, bucket, object, mode }) => {
		const key = `${bucket}/${object.key}`;
		const selected = ctx.spy(browser.selected) === key;
		const kind = fileKind(object.key);
		const isImage = kind === "image";
		const onSelect = () => browser.actions.selectObject(ctx, key);
		const openPreview = (event: MouseEvent) => {
			event.stopPropagation();
			browser.actions.openPreview(ctx, { bucket, key: object.key });
		};

		const previewButton =
			isImage && previewsEnabled ? (
				<button
					type="button"
					aria-label={labels.preview}
					onClick={openPreview}
					className="rounded bg-neutral-950/70 p-1 text-neutral-200 hover:bg-neutral-950"
				>
					<EyeIcon />
				</button>
			) : null;

		if (mode === "grid") {
			return (
				<div className="relative min-w-0">
					<RowButton
						onClick={onSelect}
						selected={selected}
						className="flex w-full min-w-0 flex-col gap-1 rounded-lg bg-neutral-800 p-2 hover:bg-neutral-700"
					>
						<div className="flex h-24 w-full items-center justify-center overflow-hidden rounded bg-neutral-900 text-neutral-500">
							{isImage && previewsEnabled ? (
								<LazyPreview bucket={bucket} objectKey={object.key} className="size-full" />
							) : (
								<KindIcon kind={kind} className="size-8" />
							)}
						</div>
						<span className="truncate text-xs font-medium">{object.key}</span>
						<span className="text-[10px] text-neutral-400">
							{formatBytes(object.size)}
							{object.lastModified ? ` · ${formatDate(object.lastModified, "object")}` : ""}
						</span>
					</RowButton>
					{previewButton ? <div className="absolute right-2 top-2">{previewButton}</div> : null}
				</div>
			);
		}

		return (
			<div className="flex items-center gap-1">
				<RowButton
					onClick={onSelect}
					selected={selected}
					className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg bg-neutral-800 px-2 py-1 hover:bg-neutral-700"
				>
					{isImage && previewsEnabled ? (
						<LazyPreview bucket={bucket} objectKey={object.key} className="size-8" />
					) : (
						<div className="flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-500">
							<KindIcon kind={kind} />
						</div>
					)}
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="truncate text-sm font-medium">{object.key}</span>
						<span className="text-[10px] text-neutral-400">
							{formatBytes(object.size)}
							{object.lastModified ? ` · ${formatDate(object.lastModified, "object")}` : ""}
						</span>
					</div>
				</RowButton>
				{previewButton}
			</div>
		);
	}, `${name}.StorageObjectItem`);

	const StorageBucketList = reatomComponent(({ ctx }) => {
		if (ctx.spy(storage.listObjects.statusesAtom).isPending) {
			return <StorageListSkeleton />;
		}

		const error = ctx.spy(storage.listObjects.errorAtom);
		if (error) {
			return <ErrorBlock title={error.message} onRetry={() => storage.load(ctx)} labels={labels} />;
		}

		const bucket = ctx.get(storageState.bucket);
		const folder = ctx.spy(storageState.folder);
		const { folders, objects } = ctx.spy(browser.list);
		const query = ctx.spy(browser.search);
		const mode = ctx.spy(browser.viewMode);
		const nextToken = ctx.spy(storageState.nextToken);

		if (!bucket) return null;

		if (folders.length === 0 && objects.length === 0) {
			return (
				<div className="flex flex-col items-start gap-1">
					<Noop title={query ? labels.noResults : folder ? labels.emptyFolder : labels.emptyBucket} />
					{query ? (
						<button
							type="button"
							onClick={() => browser.actions.setSearch(ctx, "")}
							className="text-xs text-neutral-300 underline hover:text-neutral-100"
						>
							{labels.clearSearch}
						</button>
					) : null}
				</div>
			);
		}

		const folderItems = folders.map((prefix) => (
			<RowButton
				key={prefix}
				onClick={() => storage.openFolder(ctx, prefix)}
				className="flex h-10 w-full items-center gap-2 rounded-lg bg-neutral-800 px-2 hover:bg-neutral-700"
			>
				<div className="flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-400">
					<FolderIcon />
				</div>
				<span className="truncate text-sm font-medium">{folderName(prefix)}</span>
			</RowButton>
		));

		const objectItems = objects.map((object) => (
			<StorageObjectItem key={object.key} bucket={bucket} object={object} mode={mode} />
		));

		return (
			<div className="flex w-full flex-col gap-2">
				<div className={mode === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "flex flex-col gap-1"}>
					{folderItems}
					{objectItems}
				</div>
				{nextToken ? (
					<button
						type="button"
						onClick={() => storage.loadMore(ctx)}
						className="mx-auto rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
					>
						{labels.loadMore}
					</button>
				) : null}
			</div>
		);
	}, `${name}.StorageBucketList`);

	const StorageBucketsList = reatomComponent(({ ctx }) => {
		if (ctx.spy(storage.listBuckets.statusesAtom).isPending) {
			return <StorageListSkeleton />;
		}

		const error = ctx.spy(storage.listBuckets.errorAtom);
		if (error) {
			return <ErrorBlock title={error.message} onRetry={() => storage.load(ctx)} labels={labels} />;
		}

		const data = ctx.spy(storage.listBuckets.dataAtom);
		if (!data || data.length === 0) return <Noop title={labels.noBuckets} />;

		return (
			<div className="flex w-full flex-col gap-1">
				{data.map((bucket) => {
					const available = bucket.available !== false;

					return (
						<button
							key={bucket.name}
							type="button"
							disabled={!available}
							title={available ? undefined : labels.unavailable}
							onClick={() => storage.selectBucket(ctx, bucket.name)}
							className="flex h-8 w-full items-center justify-between gap-2 rounded-lg bg-neutral-800 px-2 text-left hover:bg-neutral-700 disabled:pointer-events-none disabled:opacity-40"
						>
							<span className="truncate text-sm leading-5">{bucket.name}</span>
							<span className="text-[12px] leading-4">{formatDate(bucket.creationDate, "bucket")}</span>
						</button>
					);
				})}
			</div>
		);
	}, `${name}.StorageBucketsList`);

	const TreeNode = reatomComponent<{ prefix: string; depth: number }>(({ ctx, prefix, depth }) => {
		const tree = ctx.spy(storageState.tree);
		const open = ctx.spy(storageState.treeOpen)[prefix] ?? false;
		const entry: StorageTreeEntry | undefined = tree[prefix];
		const current = ctx.spy(storageState.folder) === prefix;
		const folders = entry?.folders ?? [];
		const hasChevron = !entry?.loaded || folders.length > 0;

		const openFolder = () => {
			storage.openFolder(ctx, prefix);
			if (!open) storage.toggleTree(ctx, prefix);
			else storage.loadTree(ctx, prefix);
		};

		return (
			<div className="flex flex-col">
				<div
					className={`flex items-center gap-1 rounded ${current ? "bg-neutral-800" : ""}`}
					style={{ paddingLeft: depth * 10 }}
				>
					<button
						type="button"
						aria-label={open ? "Collapse" : "Expand"}
						onClick={() => storage.toggleTree(ctx, prefix)}
						className="flex size-5 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-200"
					>
						{entry?.loading ? <Spinner /> : hasChevron ? <ChevronIcon open={open} /> : null}
					</button>
					<button
						type="button"
						onClick={openFolder}
						className={`flex min-w-0 flex-1 items-center gap-1 truncate py-1 pr-1 text-left text-xs hover:text-neutral-100 ${
							current ? "text-neutral-100" : "text-neutral-400"
						}`}
					>
						<FolderIcon className="size-3.5 shrink-0" />
						<span className="truncate">{folderName(prefix)}</span>
					</button>
				</div>
				{open && entry?.error ? (
					<button
						type="button"
						onClick={() => storage.loadTree(ctx, prefix)}
						className="ml-6 text-left text-[10px] text-red-300 underline"
					>
						{labels.retry}
					</button>
				) : null}
				{open ? folders.map((child) => <TreeNode key={child} prefix={child} depth={depth + 1} />) : null}
			</div>
		);
	}, `${name}.TreeNode`);

	const StorageTree = reatomComponent(({ ctx }) => {
		const bucket = ctx.spy(storageState.bucket);
		const root = ctx.spy(storageState.tree)[""];

		if (!bucket) return null;

		return (
			<div className="flex w-40 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-800 pr-1">
				<button
					type="button"
					onClick={() => {
						storage.openFolder(ctx, "");
						storage.loadTree(ctx, "");
					}}
					className="flex items-center gap-1 rounded px-1 py-1 text-left text-xs text-neutral-200 hover:bg-neutral-800"
				>
					<FolderIcon className="size-3.5" />
					<span className="truncate">{bucket}</span>
				</button>
				{root?.loading ? (
					<div className="px-2">
						<Spinner />
					</div>
				) : null}
				{root?.error ? (
					<button
						type="button"
						onClick={() => storage.loadTree(ctx, "")}
						className="px-2 text-left text-[10px] text-red-300 underline"
					>
						{labels.retry}
					</button>
				) : null}
				{root?.folders.map((prefix) => (
					<TreeNode key={prefix} prefix={prefix} depth={1} />
				))}
			</div>
		);
	}, `${name}.StorageTree`);

	const SelectionFooter = reatomComponent(({ ctx }) => {
		if (selectionMode !== "confirm") return null;

		const selected = ctx.spy(browser.selected);
		if (!selected) return null;

		return (
			<div className="flex items-center gap-2 border-t border-neutral-800 pt-2">
				<span className="min-w-0 flex-1 truncate text-xs text-neutral-300">{selected}</span>
				<button
					type="button"
					onClick={() => browser.actions.clearSelection(ctx)}
					className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
				>
					{labels.cancel}
				</button>
				<button
					type="button"
					onClick={() => browser.actions.confirmSelection(ctx)}
					className="rounded-lg bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-900 hover:bg-white"
				>
					{labels.select}
				</button>
			</div>
		);
	}, `${name}.SelectionFooter`);

	const Lightbox = reatomComponent(({ ctx }) => {
		const url = ctx.spy(browser.lightbox);

		if (!url || typeof document === "undefined") return null;

		return createPortal(
			<div
				role="dialog"
				aria-modal="true"
				aria-label={labels.preview}
				className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
				onClick={() => browser.actions.closePreview(ctx)}
				onKeyDown={(event) => {
					if (event.key === "Escape") browser.actions.closePreview(ctx);
				}}
			>
				<img src={url} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
				<button
					type="button"
					aria-label={labels.closePreview}
					onClick={() => browser.actions.closePreview(ctx)}
					className="absolute right-4 top-4 rounded-lg bg-neutral-900/80 p-2 text-neutral-100 hover:bg-neutral-900"
				>
					<CloseIcon className="size-4" />
				</button>
			</div>,
			document.body,
		);
	}, `${name}.Lightbox`);

	const StorageContent = reatomComponent(({ ctx }) => {
		const section = ctx.spy(storageState.section);
		const folder = ctx.spy(storageState.folder);
		const bucket = ctx.spy(storageState.bucket);
		const treeVisible = ctx.spy(browser.treeVisible);
		const inBucket = section === "bucket-list";

		useUpdate(
			(loadCtx) => {
				storage.load(loadCtx);
				if (bucket) storage.loadTree(loadCtx, "");
			},
			[section, folder, bucket],
		);

		return (
			<div className={`flex min-h-0 w-full flex-col gap-2 ${className ?? ""}`}>
				<StorageIconSprite />
				<div className="flex w-full items-center gap-1">
					<BackButton
						label={inBucket || folder ? labels.back : labels.close}
						close={!(inBucket || folder)}
						onClick={() => storage.goBack(ctx)}
					/>
					{inBucket ? (
						<Breadcrumbs />
					) : (
						<span className="truncate text-sm text-neutral-200">{ctx.spy(storageTitleAtom)}</span>
					)}
					{inBucket && showTree ? (
						<button
							type="button"
							aria-label={labels.tree}
							onClick={() => browser.actions.toggleTreeVisible(ctx)}
							className={`ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-neutral-800 ${
								treeVisible ? "text-neutral-100" : "text-neutral-500"
							}`}
						>
							<TreeIcon />
						</button>
					) : null}
				</div>

				{inBucket ? (
					<div className="flex min-h-0 flex-1 gap-2">
						{showTree && treeVisible ? <StorageTree /> : null}
						<div className="flex min-h-0 flex-1 flex-col gap-2">
							<StorageToolbar />
							<div className="min-h-0 flex-1 overflow-y-auto">
								<StorageBucketList />
							</div>
							<SelectionFooter />
						</div>
					</div>
				) : (
					<div className="min-h-0 flex-1 overflow-y-auto">
						<StorageBucketsList />
					</div>
				)}
				<Lightbox />
			</div>
		);
	}, `${name}.StorageContent`);

	return { StorageContent };
}
