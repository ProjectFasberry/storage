import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { atom } from "@reatom/framework";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
export const defaultStorageLabels = {
    bucketsTitle: "Buckets",
    objectsTitle: (bucket, folder) => `Objects in ${bucket}${folder ? `/${folder}` : ""}`,
    emptyBucket: "Bucket is empty",
    emptyFolder: "Folder is empty",
    noBuckets: "No buckets",
    unavailable: "Bucket unavailable",
    back: "Back",
    close: "Close",
};
const formatBytes = (value) => {
    if (value === undefined || value === null)
        return "—";
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
const defaultFormatDate = (value, kind) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
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
const FolderIcon = () => (_jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, className: "size-4", "aria-hidden": "true", children: _jsx("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" }) }));
const FileIcon = () => (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, className: "size-4", "aria-hidden": "true", children: [_jsx("path", { d: "M6 3h8l4 4v14H6V3Z" }), _jsx("path", { d: "M14 3v5h5" })] }));
const ArrowLeftIcon = () => (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, className: "size-4", "aria-hidden": "true", children: [_jsx("path", { d: "M19 12H5" }), _jsx("path", { d: "m11 18-6-6 6-6" })] }));
const XIcon = () => (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, className: "size-4", "aria-hidden": "true", children: [_jsx("path", { d: "m6 6 12 12" }), _jsx("path", { d: "m18 6-12 12" })] }));
const Skeleton = ({ className }) => (_jsx("div", { className: `animate-pulse rounded bg-neutral-800 ${className ?? ""}` }));
const Noop = ({ title }) => _jsx("span", { className: "text-sm leading-4 text-neutral-500", children: title });
const ErrorBlock = ({ title }) => (_jsx("div", { role: "alert", "aria-live": "assertive", className: "flex max-w-2xl items-center justify-start rounded-lg bg-red-500/20 px-4 py-2", children: _jsx("span", { className: "text-base font-semibold leading-5 text-red-300", children: title }) }));
const BackButton = ({ onClick, label, close }) => (_jsx("button", { type: "button", "aria-label": label, onClick: onClick, className: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-neutral-50", children: close ? _jsx(XIcon, {}) : _jsx(ArrowLeftIcon, {}) }));
export function createStorageView({ name, storage, storageState, onSelectFile, labels: labelOverrides, formatDate = defaultFormatDate, className, }) {
    const labels = { ...defaultStorageLabels, ...labelOverrides };
    const storageTitleAtom = atom((ctx) => {
        const section = ctx.spy(storageState.section);
        const folder = ctx.spy(storageState.folder);
        if (section === "buckets-list")
            return labels.bucketsTitle;
        return labels.objectsTitle(ctx.spy(storageState.bucket) ?? "", folder);
    }, `${name}.storageTitle`);
    const StorageListSkeleton = () => (_jsx("div", { className: "flex w-full flex-col gap-1", children: SKELETON_KEYS.map((key) => (_jsx(Skeleton, { className: "h-8 w-full" }, key))) }));
    const StorageObjectRow = reatomComponent(({ ctx, bucket, object, onSelect }) => {
        const key = `${bucket}/${object.key}`;
        const preview = ctx.spy(storage.previews)[key];
        const isImage = IMAGE_RE.test(object.key);
        useUpdate((ctx) => {
            if (isImage && !preview) {
                storage.loadPreview(ctx, { bucket, key: object.key });
            }
        }, [preview, isImage]);
        return (_jsxs("button", { type: "button", className: "flex min-h-10 w-full items-center gap-2 rounded-lg bg-neutral-800 px-2 py-1 text-left hover:bg-neutral-700", onClick: onSelect, children: [isImage && preview ? (_jsx("img", { src: preview, alt: "", className: "size-8 shrink-0 rounded object-cover" })) : (_jsx("div", { className: "flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-500", children: _jsx(FileIcon, {}) })), _jsxs("div", { className: "flex min-w-0 flex-col", children: [_jsx("span", { className: "truncate text-sm font-medium", children: object.key }), _jsxs("span", { className: "text-[10px] text-neutral-400", children: [formatBytes(object.size), object.lastModified ? ` · ${formatDate(object.lastModified, "object")}` : ""] })] })] }));
    }, `${name}.StorageObjectRow`);
    const StorageBucketList = reatomComponent(({ ctx }) => {
        if (ctx.spy(storage.listObjects.statusesAtom).isPending) {
            return _jsx(StorageListSkeleton, {});
        }
        const error = ctx.spy(storage.listObjects.errorAtom);
        if (error)
            return _jsx(ErrorBlock, { title: error.message });
        const data = ctx.spy(storage.listObjects.dataAtom);
        const folders = data?.commonPrefixes ?? [];
        const objects = data?.contents ?? [];
        const bucket = ctx.get(storageState.bucket);
        const folder = ctx.spy(storageState.folder);
        if (!bucket)
            return null;
        if (folders.length === 0 && objects.length === 0) {
            return _jsx(Noop, { title: folder ? labels.emptyFolder : labels.emptyBucket });
        }
        return (_jsxs("div", { className: "flex max-h-[60vh] w-full flex-col gap-1 overflow-y-auto", children: [folders.map(({ prefix }) => (_jsxs("button", { type: "button", className: "flex h-10 w-full items-center gap-2 rounded-lg bg-neutral-800 px-2 text-left hover:bg-neutral-700", onClick: () => storage.openFolder(ctx, prefix), children: [_jsx("div", { className: "flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-400", children: _jsx(FolderIcon, {}) }), _jsx("span", { className: "truncate text-sm font-medium", children: prefix.slice(folder.length) })] }, prefix))), objects.map((object) => (_jsx(StorageObjectRow, { bucket: bucket, object: object, onSelect: () => {
                        onSelectFile?.(ctx, `${bucket}/${object.key}`);
                        storageState.isOpen(ctx, false);
                    } }, object.key)))] }));
    }, `${name}.StorageBucketList`);
    const StorageBucketsList = reatomComponent(({ ctx }) => {
        if (ctx.spy(storage.listBuckets.statusesAtom).isPending) {
            return _jsx(StorageListSkeleton, {});
        }
        const error = ctx.spy(storage.listBuckets.errorAtom);
        if (error)
            return _jsx(ErrorBlock, { title: error.message });
        const data = ctx.spy(storage.listBuckets.dataAtom);
        if (!data || data.length === 0)
            return _jsx(Noop, { title: labels.noBuckets });
        return (_jsx("div", { className: "flex w-full flex-col gap-1", children: data.map((bucket) => {
                const available = bucket.available !== false;
                return (_jsxs("button", { type: "button", disabled: !available, title: available ? undefined : labels.unavailable, className: "flex h-8 w-full items-center justify-between gap-2 rounded-lg bg-neutral-800 px-2 text-left hover:bg-neutral-700 disabled:pointer-events-none disabled:opacity-40", onClick: () => storage.selectBucket(ctx, bucket.name), children: [_jsx("span", { className: "truncate text-sm leading-5", children: bucket.name }), _jsx("span", { className: "text-[12px] leading-4", children: formatDate(bucket.creationDate, "bucket") })] }, bucket.name));
            }) }));
    }, `${name}.StorageBucketsList`);
    const sections = {
        "buckets-list": _jsx(StorageBucketsList, {}),
        "bucket-list": _jsx(StorageBucketList, {}),
    };
    const StorageContent = reatomComponent(({ ctx }) => {
        const section = ctx.spy(storageState.section);
        const folder = ctx.spy(storageState.folder);
        const bucket = ctx.spy(storageState.bucket);
        const inBucket = section === "bucket-list";
        useUpdate((loadCtx) => {
            storage.load(loadCtx);
        }, [section, folder, bucket]);
        return (_jsxs("div", { className: `flex w-full flex-col gap-1 ${className ?? ""}`, children: [_jsxs("div", { className: "flex w-full items-center justify-between gap-1", children: [_jsx(BackButton, { label: inBucket || folder ? labels.back : labels.close, close: !(inBucket || folder), onClick: () => storage.goBack(ctx) }), _jsx("span", { className: "text-center text-sm leading-4", children: ctx.spy(storageTitleAtom) }), _jsx("span", {})] }), sections[section]] }));
    }, `${name}.StorageContent`);
    return { StorageContent };
}
//# sourceMappingURL=index.js.map