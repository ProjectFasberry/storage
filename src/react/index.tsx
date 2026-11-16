import { atom, type Ctx, type CtxSpy } from "@reatom/framework";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import type { ReactNode } from "react";
import type { StorageModel, StorageObject, StorageState } from "../core";

export type StorageLabels = {
	bucketsTitle: string;
	objectsTitle: (bucket: string, folder: string) => string;
	emptyBucket: string;
	emptyFolder: string;
	noBuckets: string;
	unavailable: string;
	back: string;
	close: string;
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
};

export type StorageViewOptions = {
	name: string;
	storage: StorageModel;
	storageState: StorageState;
	onSelectFile?: (ctx: Ctx, fileName: string) => void;
	labels?: Partial<StorageLabels>;
	formatDate?: (value: string, kind: "object" | "bucket") => string;
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

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;
const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"];

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

const FolderIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4" aria-hidden="true">
		<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
	</svg>
);

const FileIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4" aria-hidden="true">
		<path d="M6 3h8l4 4v14H6V3Z" />
		<path d="M14 3v5h5" />
	</svg>
);

const ArrowLeftIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4" aria-hidden="true">
		<path d="M19 12H5" />
		<path d="m11 18-6-6 6-6" />
	</svg>
);

const XIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4" aria-hidden="true">
		<path d="m6 6 12 12" />
		<path d="m18 6-12 12" />
	</svg>
);

const Skeleton = ({ className }: { className?: string }) => (
	<div className={`animate-pulse rounded bg-neutral-800 ${className ?? ""}`} />
);

const Noop = ({ title }: { title: string }) => <span className="text-sm leading-4 text-neutral-500">{title}</span>;

const ErrorBlock = ({ title }: { title: string }) => (
	<div
		role="alert"
		aria-live="assertive"
		className="flex max-w-2xl items-center justify-start rounded-lg bg-red-500/20 px-4 py-2"
	>
		<span className="text-base font-semibold leading-5 text-red-300">{title}</span>
	</div>
);

const BackButton = ({ onClick, label, close }: { onClick: () => void; label: string; close: boolean }) => (
	<button
		type="button"
		aria-label={label}
		onClick={onClick}
		className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-neutral-50"
	>
		{close ? <XIcon /> : <ArrowLeftIcon />}
	</button>
);

export function createStorageView({
	name,
	storage,
	storageState,
	onSelectFile,
	labels: labelOverrides,
	formatDate = defaultFormatDate,
	className,
}: StorageViewOptions) {
	const labels = { ...defaultStorageLabels, ...labelOverrides };

	const storageTitleAtom = atom((ctx: CtxSpy) => {
		const section = ctx.spy(storageState.section);
		const folder = ctx.spy(storageState.folder);

		if (section === "buckets-list") return labels.bucketsTitle;

		return labels.objectsTitle(ctx.spy(storageState.bucket) ?? "", folder);
	}, `${name}.storageTitle`);

	const StorageListSkeleton = () => (
		<div className="flex w-full flex-col gap-1">
			{SKELETON_KEYS.map((key) => (
				<Skeleton key={key} className="h-8 w-full" />
			))}
		</div>
	);

	const StorageObjectRow = reatomComponent<{
		bucket: string;
		object: StorageObject;
		onSelect: () => void;
	}>(({ ctx, bucket, object, onSelect }) => {
		const key = `${bucket}/${object.key}`;
		const preview = ctx.spy(storage.previews)[key];
		const isImage = IMAGE_RE.test(object.key);

		useUpdate(
			(ctx) => {
				if (isImage && !preview) {
					storage.loadPreview(ctx, { bucket, key: object.key });
				}
			},
			[preview, isImage],
		);

		return (
			<button
				type="button"
				className="flex min-h-10 w-full items-center gap-2 rounded-lg bg-neutral-800 px-2 py-1 text-left hover:bg-neutral-700"
				onClick={onSelect}
			>
				{isImage && preview ? (
					<img src={preview} alt="" className="size-8 shrink-0 rounded object-cover" />
				) : (
					<div className="flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-500">
						<FileIcon />
					</div>
				)}
				<div className="flex min-w-0 flex-col">
					<span className="truncate text-sm font-medium">{object.key}</span>
					<span className="text-[10px] text-neutral-400">
						{formatBytes(object.size)}
						{object.lastModified ? ` · ${formatDate(object.lastModified, "object")}` : ""}
					</span>
				</div>
			</button>
		);
	}, `${name}.StorageObjectRow`);

	const StorageBucketList = reatomComponent(({ ctx }) => {
		if (ctx.spy(storage.listObjects.statusesAtom).isPending) {
			return <StorageListSkeleton />;
		}

		const error = ctx.spy(storage.listObjects.errorAtom);
		if (error) return <ErrorBlock title={error.message} />;

		const data = ctx.spy(storage.listObjects.dataAtom);
		const folders = data?.commonPrefixes ?? [];
		const objects = data?.contents ?? [];
		const bucket = ctx.get(storageState.bucket);
		const folder = ctx.spy(storageState.folder);

		if (!bucket) return null;

		if (folders.length === 0 && objects.length === 0) {
			return <Noop title={folder ? labels.emptyFolder : labels.emptyBucket} />;
		}

		return (
			<div className="flex max-h-[60vh] w-full flex-col gap-1 overflow-y-auto">
				{folders.map(({ prefix }) => (
					<button
						key={prefix}
						type="button"
						className="flex h-10 w-full items-center gap-2 rounded-lg bg-neutral-800 px-2 text-left hover:bg-neutral-700"
						onClick={() => storage.openFolder(ctx, prefix)}
					>
						<div className="flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-400">
							<FolderIcon />
						</div>
						<span className="truncate text-sm font-medium">{prefix.slice(folder.length)}</span>
					</button>
				))}
				{objects.map((object) => (
					<StorageObjectRow
						key={object.key}
						bucket={bucket}
						object={object}
						onSelect={() => {
							onSelectFile?.(ctx, `${bucket}/${object.key}`);
							storageState.isOpen(ctx, false);
						}}
					/>
				))}
			</div>
		);
	}, `${name}.StorageBucketList`);

	const StorageBucketsList = reatomComponent(({ ctx }) => {
		if (ctx.spy(storage.listBuckets.statusesAtom).isPending) {
			return <StorageListSkeleton />;
		}

		const error = ctx.spy(storage.listBuckets.errorAtom);
		if (error) return <ErrorBlock title={error.message} />;

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
							className="flex h-8 w-full items-center justify-between gap-2 rounded-lg bg-neutral-800 px-2 text-left hover:bg-neutral-700 disabled:pointer-events-none disabled:opacity-40"
							onClick={() => storage.selectBucket(ctx, bucket.name)}
						>
							<span className="truncate text-sm leading-5">{bucket.name}</span>
							<span className="text-[12px] leading-4">{formatDate(bucket.creationDate, "bucket")}</span>
						</button>
					);
				})}
			</div>
		);
	}, `${name}.StorageBucketsList`);

	const sections: Record<string, ReactNode> = {
		"buckets-list": <StorageBucketsList />,
		"bucket-list": <StorageBucketList />,
	};

	const StorageContent = reatomComponent(({ ctx }) => {
		const section = ctx.spy(storageState.section);
		const folder = ctx.spy(storageState.folder);
		const bucket = ctx.spy(storageState.bucket);
		const inBucket = section === "bucket-list";

		useUpdate(
			(loadCtx) => {
				storage.load(loadCtx);
			},
			[section, folder, bucket],
		);

		return (
			<div className={`flex w-full flex-col gap-1 ${className ?? ""}`}>
				<div className="flex w-full items-center justify-between gap-1">
					<BackButton
						label={inBucket || folder ? labels.back : labels.close}
						close={!(inBucket || folder)}
						onClick={() => storage.goBack(ctx)}
					/>
					<span className="text-center text-sm leading-4">{ctx.spy(storageTitleAtom)}</span>
					<span />
				</div>
				{sections[section]}
			</div>
		);
	}, `${name}.StorageContent`);

	return { StorageContent };
}
