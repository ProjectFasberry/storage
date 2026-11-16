import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { atom } from "@reatom/framework";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { createPortal } from "react-dom";
import { createStorageBrowser, defaultStorageLabels, folderName, } from "../headless";
export { defaultStorageLabels };
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
const IMAGE_RE = /\.(png|jpe?g|webp|gif|avif|bmp|ico)$/i;
const TEXT_RE = /\.(txt|md|markdown|log|csv|tsv|json|ya?ml|toml|ini|conf|env)$/i;
const CODE_RE = /\.(ts|tsx|js|jsx|mjs|cjs|py|rs|go|java|kt|kts|sh|bash|zsh|sql|html?|css|scss|less|xml|svg)$/i;
const ARCHIVE_RE = /\.(zip|tar|gz|tgz|bz2|xz|7z|rar)$/i;
const AUDIO_RE = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|avi|mkv|m4v)$/i;
const fileKind = (key) => {
    if (IMAGE_RE.test(key))
        return "image";
    if (TEXT_RE.test(key))
        return "text";
    if (CODE_RE.test(key))
        return "code";
    if (ARCHIVE_RE.test(key))
        return "archive";
    if (AUDIO_RE.test(key))
        return "audio";
    if (VIDEO_RE.test(key))
        return "video";
    return "other";
};
const StorageIconSprite = () => (_jsxs("svg", { "aria-hidden": "true", style: { display: "none" }, children: [_jsx("symbol", { id: "storage-icon-folder", viewBox: "0 0 24 24", children: _jsx("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" }) }), _jsxs("symbol", { id: "storage-icon-file", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M6 3h8l4 4v14H6V3Z" }), _jsx("path", { d: "M14 3v5h5" })] }), _jsxs("symbol", { id: "storage-icon-image", viewBox: "0 0 24 24", children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }), _jsx("circle", { cx: "8.5", cy: "9.5", r: "1.5" }), _jsx("path", { d: "m21 15-5-5L5 21" })] }), _jsxs("symbol", { id: "storage-icon-text", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M6 3h8l4 4v14H6V3Z" }), _jsx("path", { d: "M9 12h6M9 16h6M9 8h3" })] }), _jsx("symbol", { id: "storage-icon-code", viewBox: "0 0 24 24", children: _jsx("path", { d: "m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" }) }), _jsxs("symbol", { id: "storage-icon-archive", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M4 7h16v13H4V7ZM3 4h18v3H3V4Z" }), _jsx("path", { d: "M10 11h4" })] }), _jsxs("symbol", { id: "storage-icon-audio", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M9 18V6l10-2v12" }), _jsx("circle", { cx: "6", cy: "18", r: "3" }), _jsx("circle", { cx: "16", cy: "16", r: "3" })] }), _jsxs("symbol", { id: "storage-icon-video", viewBox: "0 0 24 24", children: [_jsx("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }), _jsx("path", { d: "m10 9 5 3-5 3V9Z" })] }), _jsx("symbol", { id: "storage-icon-chevron", viewBox: "0 0 24 24", children: _jsx("path", { d: "m9 6 6 6-6 6" }) }), _jsxs("symbol", { id: "storage-icon-search", viewBox: "0 0 24 24", children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "m20 20-4-4" })] }), _jsx("symbol", { id: "storage-icon-close", viewBox: "0 0 24 24", children: _jsx("path", { d: "m6 6 12 12M18 6 6 18" }) }), _jsx("symbol", { id: "storage-icon-arrow-left", viewBox: "0 0 24 24", children: _jsx("path", { d: "M19 12H5M11 18l-6-6 6-6" }) }), _jsxs("symbol", { id: "storage-icon-tree", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M5 4v16M5 8h6M5 16h6M11 6v4M11 14v4" }), _jsx("rect", { x: "16", y: "4", width: "4", height: "4", rx: "1" }), _jsx("rect", { x: "16", y: "10", width: "4", height: "4", rx: "1" }), _jsx("rect", { x: "16", y: "16", width: "4", height: "4", rx: "1" })] }), _jsxs("symbol", { id: "storage-icon-grid", viewBox: "0 0 24 24", children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] }), _jsx("symbol", { id: "storage-icon-list", viewBox: "0 0 24 24", children: _jsx("path", { d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" }) }), _jsxs("symbol", { id: "storage-icon-eye", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] }), _jsxs("symbol", { id: "storage-icon-retry", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M20 11a8 8 0 1 0-2.3 5.7" }), _jsx("path", { d: "M20 4v7h-7" })] })] }));
const Icon = ({ name, className = "size-4" }) => (_jsx("svg", { "aria-hidden": "true", focusable: "false", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", className: className, children: _jsx("use", { href: `#storage-icon-${name}` }) }));
const FolderIcon = ({ className = "size-4" }) => _jsx(Icon, { name: "folder", className: className });
const FileIcon = ({ className = "size-4" }) => _jsx(Icon, { name: "file", className: className });
const ImageIcon = ({ className = "size-4" }) => _jsx(Icon, { name: "image", className: className });
const TextIcon = ({ className = "size-4" }) => _jsx(Icon, { name: "text", className: className });
const CodeIcon = ({ className = "size-4" }) => _jsx(Icon, { name: "code", className: className });
const ArchiveIcon = ({ className = "size-4" }) => _jsx(Icon, { name: "archive", className: className });
const AudioIcon = ({ className = "size-4" }) => _jsx(Icon, { name: "audio", className: className });
const VideoIcon = ({ className = "size-4" }) => _jsx(Icon, { name: "video", className: className });
const KindIcon = ({ kind, className }) => {
    switch (kind) {
        case "image":
            return _jsx(ImageIcon, { className: className });
        case "text":
            return _jsx(TextIcon, { className: className });
        case "code":
            return _jsx(CodeIcon, { className: className });
        case "archive":
            return _jsx(ArchiveIcon, { className: className });
        case "audio":
            return _jsx(AudioIcon, { className: className });
        case "video":
            return _jsx(VideoIcon, { className: className });
        default:
            return _jsx(FileIcon, { className: className });
    }
};
const ChevronIcon = ({ open }) => (_jsx(Icon, { name: "chevron", className: `size-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}` }));
const SearchIcon = () => _jsx(Icon, { name: "search", className: "size-3.5" });
const CloseIcon = ({ className = "size-3.5" }) => _jsx(Icon, { name: "close", className: className });
const ArrowLeftIcon = () => _jsx(Icon, { name: "arrow-left" });
const TreeIcon = () => _jsx(Icon, { name: "tree" });
const GridIcon = () => _jsx(Icon, { name: "grid" });
const ListIcon = () => _jsx(Icon, { name: "list" });
const EyeIcon = () => _jsx(Icon, { name: "eye" });
const RetryIcon = () => _jsx(Icon, { name: "retry" });
const Skeleton = ({ className }) => (_jsx("div", { className: `animate-pulse rounded bg-neutral-800 ${className ?? ""}` }));
const Noop = ({ title }) => _jsx("span", { className: "text-sm leading-4 text-neutral-500", children: title });
const ErrorBlock = ({ title, onRetry, labels }) => (_jsxs("div", { role: "alert", "aria-live": "assertive", className: "flex max-w-2xl flex-col gap-2 rounded-lg bg-red-500/20 px-4 py-3", children: [_jsx("span", { className: "text-sm font-semibold leading-5 text-red-300", children: title }), _jsxs("button", { type: "button", onClick: onRetry, className: "inline-flex w-fit items-center gap-1 rounded-lg bg-neutral-900/60 px-2 py-1 text-xs text-neutral-100 hover:bg-neutral-900", children: [_jsx(RetryIcon, {}), labels.retry] })] }));
const Spinner = () => (_jsx("span", { className: "size-3.5 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200" }));
const BackButton = ({ onClick, label, close }) => (_jsx("button", { type: "button", "aria-label": label, onClick: onClick, className: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-neutral-50", children: close ? _jsx(CloseIcon, { className: "size-4" }) : _jsx(ArrowLeftIcon, {}) }));
const RowButton = ({ onClick, children, className = "", selected = false, }) => (_jsx("button", { type: "button", "aria-pressed": selected, onClick: onClick, className: `text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${selected ? "ring-1 ring-neutral-400" : ""} ${className}`, children: children }));
export function createStorageView(options) {
    const { name, storage, storageState, className, showTree = true } = options;
    const browser = createStorageBrowser(options);
    const { labels, formatDate, previews: previewsEnabled, selectionMode } = browser;
    const storageTitleAtom = atom((ctx) => {
        const section = ctx.spy(storageState.section);
        const folder = ctx.spy(storageState.folder);
        if (section === "buckets-list")
            return labels.bucketsTitle;
        return labels.objectsTitle(ctx.spy(storageState.bucket) ?? "", folder);
    }, `${name}.storageTitle`);
    const StorageListSkeleton = () => (_jsx("div", { className: "flex w-full flex-col gap-1", children: ["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (_jsx(Skeleton, { className: "h-8 w-full" }, key))) }));
    const LazyPreview = reatomComponent(({ ctx, bucket, objectKey, className: previewClassName }) => {
        const preview = ctx.spy(storage.previews)[`${bucket}/${objectKey}`];
        useUpdate((loadCtx) => {
            if (previewsEnabled && !preview) {
                storage.loadPreview(loadCtx, { bucket, key: objectKey });
            }
        }, [preview]);
        return (_jsx("div", { className: `flex shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-900 text-neutral-500 ${previewClassName ?? ""}`, children: preview ? _jsx("img", { src: preview, alt: "", className: "size-full object-cover" }) : _jsx(ImageIcon, { className: "size-4" }) }));
    }, `${name}.LazyPreview`);
    const Breadcrumbs = reatomComponent(({ ctx }) => {
        const bucket = ctx.spy(storageState.bucket);
        const folder = ctx.spy(storageState.folder);
        const parts = folder.split("/").filter(Boolean);
        return (_jsxs("div", { className: "flex min-w-0 items-center gap-1 overflow-hidden text-xs text-neutral-400", children: [_jsx("button", { type: "button", onClick: () => storageState.section(ctx, "buckets-list"), className: "shrink-0 hover:text-neutral-100", children: labels.bucketsTitle }), _jsx("span", { className: "shrink-0", children: "/" }), _jsx("button", { type: "button", onClick: () => storage.openFolder(ctx, ""), className: "shrink-0 truncate hover:text-neutral-100", children: bucket }), parts.map((part, index) => {
                    const prefix = `${parts.slice(0, index + 1).join("/")}/`;
                    const isLast = index === parts.length - 1;
                    return (_jsxs("span", { className: "flex min-w-0 items-center gap-1", children: [_jsx("span", { className: "shrink-0", children: "/" }), isLast ? (_jsx("span", { className: "truncate text-neutral-200", children: part })) : (_jsx("button", { type: "button", onClick: () => storage.openFolder(ctx, prefix), className: "truncate hover:text-neutral-100", children: part }))] }, prefix));
                })] }));
    }, `${name}.Breadcrumbs`);
    const StorageToolbar = reatomComponent(({ ctx }) => {
        const search = ctx.spy(browser.search);
        const sort = ctx.spy(browser.sort);
        const sortDir = ctx.spy(browser.sortDir);
        const viewMode = ctx.spy(browser.viewMode);
        return (_jsxs("div", { className: "flex w-full flex-wrap items-center gap-1", children: [_jsxs("div", { className: "relative min-w-40 flex-1", children: [_jsx("span", { className: "pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500", children: _jsx(SearchIcon, {}) }), _jsx("input", { value: search, onChange: (event) => browser.actions.setSearch(ctx, event.target.value), placeholder: labels.search, "aria-label": labels.search, className: "h-8 w-full rounded-lg border border-neutral-800 bg-neutral-800 pl-7 pr-7 text-xs text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600" }), search ? (_jsx("button", { type: "button", "aria-label": labels.clearSearch, onClick: () => browser.actions.setSearch(ctx, ""), className: "absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200", children: _jsx(CloseIcon, {}) })) : null] }), _jsxs("label", { className: "flex items-center gap-1 text-xs text-neutral-500", children: [_jsx("span", { className: "sr-only", children: labels.sort }), _jsxs("select", { value: sort, onChange: (event) => browser.actions.setSort(ctx, event.target.value), className: "h-8 rounded-lg border border-neutral-800 bg-neutral-800 px-1 text-xs text-neutral-100 outline-none focus:border-neutral-600", children: [_jsx("option", { value: "name", children: labels.sortName }), _jsx("option", { value: "size", children: labels.sortSize }), _jsx("option", { value: "date", children: labels.sortDate })] })] }), _jsx("button", { type: "button", "aria-label": sortDir === "asc" ? labels.sortAsc : labels.sortDesc, onClick: () => browser.actions.toggleSortDir(ctx), className: "flex size-8 items-center justify-center rounded-lg bg-neutral-800 text-xs text-neutral-200 hover:bg-neutral-700", children: sortDir === "asc" ? "↑" : "↓" }), _jsx("button", { type: "button", "aria-label": viewMode === "list" ? labels.gridView : labels.listView, onClick: () => browser.actions.toggleViewMode(ctx), className: "flex size-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700", children: viewMode === "list" ? _jsx(GridIcon, {}) : _jsx(ListIcon, {}) })] }));
    }, `${name}.StorageToolbar`);
    const StorageObjectItem = reatomComponent(({ ctx, bucket, object, mode }) => {
        const key = `${bucket}/${object.key}`;
        const selected = ctx.spy(browser.selected) === key;
        const kind = fileKind(object.key);
        const isImage = kind === "image";
        const onSelect = () => browser.actions.selectObject(ctx, key);
        const openPreview = (event) => {
            event.stopPropagation();
            browser.actions.openPreview(ctx, { bucket, key: object.key });
        };
        const previewButton = isImage && previewsEnabled ? (_jsx("button", { type: "button", "aria-label": labels.preview, onClick: openPreview, className: "rounded bg-neutral-950/70 p-1 text-neutral-200 hover:bg-neutral-950", children: _jsx(EyeIcon, {}) })) : null;
        if (mode === "grid") {
            return (_jsxs("div", { className: "relative min-w-0", children: [_jsxs(RowButton, { onClick: onSelect, selected: selected, className: "flex w-full min-w-0 flex-col gap-1 rounded-lg bg-neutral-800 p-2 hover:bg-neutral-700", children: [_jsx("div", { className: "flex h-24 w-full items-center justify-center overflow-hidden rounded bg-neutral-900 text-neutral-500", children: isImage && previewsEnabled ? (_jsx(LazyPreview, { bucket: bucket, objectKey: object.key, className: "size-full" })) : (_jsx(KindIcon, { kind: kind, className: "size-8" })) }), _jsx("span", { className: "truncate text-xs font-medium", children: object.key }), _jsxs("span", { className: "text-[10px] text-neutral-400", children: [formatBytes(object.size), object.lastModified ? ` · ${formatDate(object.lastModified, "object")}` : ""] })] }), previewButton ? _jsx("div", { className: "absolute right-2 top-2", children: previewButton }) : null] }));
        }
        return (_jsxs("div", { className: "flex items-center gap-1", children: [_jsxs(RowButton, { onClick: onSelect, selected: selected, className: "flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg bg-neutral-800 px-2 py-1 hover:bg-neutral-700", children: [isImage && previewsEnabled ? (_jsx(LazyPreview, { bucket: bucket, objectKey: object.key, className: "size-8" })) : (_jsx("div", { className: "flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-500", children: _jsx(KindIcon, { kind: kind }) })), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [_jsx("span", { className: "truncate text-sm font-medium", children: object.key }), _jsxs("span", { className: "text-[10px] text-neutral-400", children: [formatBytes(object.size), object.lastModified ? ` · ${formatDate(object.lastModified, "object")}` : ""] })] })] }), previewButton] }));
    }, `${name}.StorageObjectItem`);
    const StorageBucketList = reatomComponent(({ ctx }) => {
        if (ctx.spy(storage.listObjects.statusesAtom).isPending) {
            return _jsx(StorageListSkeleton, {});
        }
        const error = ctx.spy(storage.listObjects.errorAtom);
        if (error) {
            return _jsx(ErrorBlock, { title: error.message, onRetry: () => storage.load(ctx), labels: labels });
        }
        const bucket = ctx.get(storageState.bucket);
        const folder = ctx.spy(storageState.folder);
        const { folders, objects } = ctx.spy(browser.list);
        const query = ctx.spy(browser.search);
        const mode = ctx.spy(browser.viewMode);
        const nextToken = ctx.spy(storageState.nextToken);
        if (!bucket)
            return null;
        if (folders.length === 0 && objects.length === 0) {
            return (_jsxs("div", { className: "flex flex-col items-start gap-1", children: [_jsx(Noop, { title: query ? labels.noResults : folder ? labels.emptyFolder : labels.emptyBucket }), query ? (_jsx("button", { type: "button", onClick: () => browser.actions.setSearch(ctx, ""), className: "text-xs text-neutral-300 underline hover:text-neutral-100", children: labels.clearSearch })) : null] }));
        }
        const folderItems = folders.map((prefix) => (_jsxs(RowButton, { onClick: () => storage.openFolder(ctx, prefix), className: "flex h-10 w-full items-center gap-2 rounded-lg bg-neutral-800 px-2 hover:bg-neutral-700", children: [_jsx("div", { className: "flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-400", children: _jsx(FolderIcon, {}) }), _jsx("span", { className: "truncate text-sm font-medium", children: folderName(prefix) })] }, prefix)));
        const objectItems = objects.map((object) => (_jsx(StorageObjectItem, { bucket: bucket, object: object, mode: mode }, object.key)));
        return (_jsxs("div", { className: "flex w-full flex-col gap-2", children: [_jsxs("div", { className: mode === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "flex flex-col gap-1", children: [folderItems, objectItems] }), nextToken ? (_jsx("button", { type: "button", onClick: () => storage.loadMore(ctx), className: "mx-auto rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700", children: labels.loadMore })) : null] }));
    }, `${name}.StorageBucketList`);
    const StorageBucketsList = reatomComponent(({ ctx }) => {
        if (ctx.spy(storage.listBuckets.statusesAtom).isPending) {
            return _jsx(StorageListSkeleton, {});
        }
        const error = ctx.spy(storage.listBuckets.errorAtom);
        if (error) {
            return _jsx(ErrorBlock, { title: error.message, onRetry: () => storage.load(ctx), labels: labels });
        }
        const data = ctx.spy(storage.listBuckets.dataAtom);
        if (!data || data.length === 0)
            return _jsx(Noop, { title: labels.noBuckets });
        return (_jsx("div", { className: "flex w-full flex-col gap-1", children: data.map((bucket) => {
                const available = bucket.available !== false;
                return (_jsxs("button", { type: "button", disabled: !available, title: available ? undefined : labels.unavailable, onClick: () => storage.selectBucket(ctx, bucket.name), className: "flex h-8 w-full items-center justify-between gap-2 rounded-lg bg-neutral-800 px-2 text-left hover:bg-neutral-700 disabled:pointer-events-none disabled:opacity-40", children: [_jsx("span", { className: "truncate text-sm leading-5", children: bucket.name }), _jsx("span", { className: "text-[12px] leading-4", children: formatDate(bucket.creationDate, "bucket") })] }, bucket.name));
            }) }));
    }, `${name}.StorageBucketsList`);
    const TreeNode = reatomComponent(({ ctx, prefix, depth }) => {
        const tree = ctx.spy(storageState.tree);
        const open = ctx.spy(storageState.treeOpen)[prefix] ?? false;
        const entry = tree[prefix];
        const current = ctx.spy(storageState.folder) === prefix;
        const folders = entry?.folders ?? [];
        const hasChevron = !entry?.loaded || folders.length > 0;
        const openFolder = () => {
            storage.openFolder(ctx, prefix);
            if (!open)
                storage.toggleTree(ctx, prefix);
            else
                storage.loadTree(ctx, prefix);
        };
        return (_jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: `flex items-center gap-1 rounded ${current ? "bg-neutral-800" : ""}`, style: { paddingLeft: depth * 10 }, children: [_jsx("button", { type: "button", "aria-label": open ? "Collapse" : "Expand", onClick: () => storage.toggleTree(ctx, prefix), className: "flex size-5 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-200", children: entry?.loading ? _jsx(Spinner, {}) : hasChevron ? _jsx(ChevronIcon, { open: open }) : null }), _jsxs("button", { type: "button", onClick: openFolder, className: `flex min-w-0 flex-1 items-center gap-1 truncate py-1 pr-1 text-left text-xs hover:text-neutral-100 ${current ? "text-neutral-100" : "text-neutral-400"}`, children: [_jsx(FolderIcon, { className: "size-3.5 shrink-0" }), _jsx("span", { className: "truncate", children: folderName(prefix) })] })] }), open && entry?.error ? (_jsx("button", { type: "button", onClick: () => storage.loadTree(ctx, prefix), className: "ml-6 text-left text-[10px] text-red-300 underline", children: labels.retry })) : null, open ? folders.map((child) => _jsx(TreeNode, { prefix: child, depth: depth + 1 }, child)) : null] }));
    }, `${name}.TreeNode`);
    const StorageTree = reatomComponent(({ ctx }) => {
        const bucket = ctx.spy(storageState.bucket);
        const root = ctx.spy(storageState.tree)[""];
        if (!bucket)
            return null;
        return (_jsxs("div", { className: "flex w-40 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-800 pr-1", children: [_jsxs("button", { type: "button", onClick: () => {
                        storage.openFolder(ctx, "");
                        storage.loadTree(ctx, "");
                    }, className: "flex items-center gap-1 rounded px-1 py-1 text-left text-xs text-neutral-200 hover:bg-neutral-800", children: [_jsx(FolderIcon, { className: "size-3.5" }), _jsx("span", { className: "truncate", children: bucket })] }), root?.loading ? (_jsx("div", { className: "px-2", children: _jsx(Spinner, {}) })) : null, root?.error ? (_jsx("button", { type: "button", onClick: () => storage.loadTree(ctx, ""), className: "px-2 text-left text-[10px] text-red-300 underline", children: labels.retry })) : null, root?.folders.map((prefix) => (_jsx(TreeNode, { prefix: prefix, depth: 1 }, prefix)))] }));
    }, `${name}.StorageTree`);
    const SelectionFooter = reatomComponent(({ ctx }) => {
        if (selectionMode !== "confirm")
            return null;
        const selected = ctx.spy(browser.selected);
        if (!selected)
            return null;
        return (_jsxs("div", { className: "flex items-center gap-2 border-t border-neutral-800 pt-2", children: [_jsx("span", { className: "min-w-0 flex-1 truncate text-xs text-neutral-300", children: selected }), _jsx("button", { type: "button", onClick: () => browser.actions.clearSelection(ctx), className: "rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700", children: labels.cancel }), _jsx("button", { type: "button", onClick: () => browser.actions.confirmSelection(ctx), className: "rounded-lg bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-900 hover:bg-white", children: labels.select })] }));
    }, `${name}.SelectionFooter`);
    const Lightbox = reatomComponent(({ ctx }) => {
        const url = ctx.spy(browser.lightbox);
        if (!url || typeof document === "undefined")
            return null;
        return createPortal(_jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": labels.preview, className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4", onClick: () => browser.actions.closePreview(ctx), onKeyDown: (event) => {
                if (event.key === "Escape")
                    browser.actions.closePreview(ctx);
            }, children: [_jsx("img", { src: url, alt: "", className: "max-h-full max-w-full rounded-lg object-contain" }), _jsx("button", { type: "button", "aria-label": labels.closePreview, onClick: () => browser.actions.closePreview(ctx), className: "absolute right-4 top-4 rounded-lg bg-neutral-900/80 p-2 text-neutral-100 hover:bg-neutral-900", children: _jsx(CloseIcon, { className: "size-4" }) })] }), document.body);
    }, `${name}.Lightbox`);
    const StorageContent = reatomComponent(({ ctx }) => {
        const section = ctx.spy(storageState.section);
        const folder = ctx.spy(storageState.folder);
        const bucket = ctx.spy(storageState.bucket);
        const treeVisible = ctx.spy(browser.treeVisible);
        const inBucket = section === "bucket-list";
        useUpdate((loadCtx) => {
            storage.load(loadCtx);
            if (bucket)
                storage.loadTree(loadCtx, "");
        }, [section, folder, bucket]);
        return (_jsxs("div", { className: `flex min-h-0 w-full flex-col gap-2 ${className ?? ""}`, children: [_jsx(StorageIconSprite, {}), _jsxs("div", { className: "flex w-full items-center gap-1", children: [_jsx(BackButton, { label: inBucket || folder ? labels.back : labels.close, close: !(inBucket || folder), onClick: () => storage.goBack(ctx) }), inBucket ? (_jsx(Breadcrumbs, {})) : (_jsx("span", { className: "truncate text-sm text-neutral-200", children: ctx.spy(storageTitleAtom) })), inBucket && showTree ? (_jsx("button", { type: "button", "aria-label": labels.tree, onClick: () => browser.actions.toggleTreeVisible(ctx), className: `ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-neutral-800 ${treeVisible ? "text-neutral-100" : "text-neutral-500"}`, children: _jsx(TreeIcon, {}) })) : null] }), inBucket ? (_jsxs("div", { className: "flex min-h-0 flex-1 gap-2", children: [showTree && treeVisible ? _jsx(StorageTree, {}) : null, _jsxs("div", { className: "flex min-h-0 flex-1 flex-col gap-2", children: [_jsx(StorageToolbar, {}), _jsx("div", { className: "min-h-0 flex-1 overflow-y-auto", children: _jsx(StorageBucketList, {}) }), _jsx(SelectionFooter, {})] })] })) : (_jsx("div", { className: "min-h-0 flex-1 overflow-y-auto", children: _jsx(StorageBucketsList, {}) })), _jsx(Lightbox, {})] }));
    }, `${name}.StorageContent`);
    return { StorageContent };
}
//# sourceMappingURL=index.js.map