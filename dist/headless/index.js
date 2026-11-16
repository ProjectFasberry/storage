import { action, atom, onConnect, onUpdate } from "@reatom/framework";
export const defaultStorageLabels = {
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
    selectedCount: (count, max) => (max ? `${count} / ${max} selected` : `${count} selected`),
    tree: "Folders",
    expand: "Expand",
    collapse: "Collapse",
    noResults: "Nothing found",
    listView: "List",
    gridView: "Grid",
};
export const folderName = (prefix) => {
    const clean = prefix.replace(/\/$/, "");
    const index = clean.lastIndexOf("/");
    return index === -1 ? clean : clean.slice(index + 1);
};
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
const previewKey = (bucket, key) => `${bucket}/${key}`;
const parentPrefix = (prefix) => {
    const clean = prefix.replace(/\/$/, "");
    const index = clean.lastIndexOf("/");
    return index === -1 ? "" : `${clean.slice(0, index + 1)}`;
};
/**
 * Framework-agnostic view state shared by the React and Solid adapters.
 * Rendering lives in `@projectfasberry/storage/react` (or another binding);
 * filtering, sorting, selection and the preview lightbox live here.
 */
export const createStorageBrowser = ({ name, storage, storageState, onSelectFile, labels: labelOverrides, formatDate = defaultFormatDate, previews = true, selectionMode: selectionModeOption, multiple = false, maxSelected, onSelectFiles, defaultViewMode = "list", showTree = true, }) => {
    const labels = { ...defaultStorageLabels, ...labelOverrides };
    const selectionMode = multiple ? "confirm" : (selectionModeOption ?? "immediate");
    const search = atom("", `${name}.search`);
    const sort = atom("name", `${name}.sort`);
    const sortDir = atom("asc", `${name}.sortDir`);
    const viewMode = atom(defaultViewMode, `${name}.viewMode`);
    const selected = atom([], `${name}.selected`);
    const lightbox = atom(null, `${name}.lightbox`);
    const treeVisible = atom(showTree, `${name}.treeVisible`);
    const treeFocus = atom(null, `${name}.treeFocus`);
    const list = atom((ctx) => {
        const data = ctx.spy(storage.listObjects.dataAtom);
        const query = ctx.spy(search).trim().toLowerCase();
        const sortKey = ctx.spy(sort);
        const direction = ctx.spy(sortDir);
        const folders = (data?.commonPrefixes ?? [])
            .filter(({ prefix }) => !query || folderName(prefix).toLowerCase().includes(query))
            .map(({ prefix }) => prefix);
        const objects = (data?.contents ?? []).filter((object) => !query || object.key.toLowerCase().includes(query));
        const compare = (a, b) => {
            const result = a.localeCompare(b, undefined, { numeric: true });
            return direction === "asc" ? result : -result;
        };
        folders.sort((a, b) => compare(folderName(a), folderName(b)));
        objects.sort((a, b) => {
            const result = sortKey === "size"
                ? (a.size ?? 0) - (b.size ?? 0)
                : sortKey === "date"
                    ? new Date(a.lastModified ?? 0).getTime() - new Date(b.lastModified ?? 0).getTime()
                    : a.key.localeCompare(b.key, undefined, { numeric: true });
            return direction === "asc" ? result : -result;
        });
        return { folders, objects };
    }, `${name}.list`);
    const treeRows = atom((ctx) => {
        const bucket = ctx.spy(storageState.bucket);
        if (!bucket)
            return [];
        const tree = ctx.spy(storageState.tree);
        const open = ctx.spy(storageState.treeOpen);
        const rows = [{ prefix: "", depth: 0, expandable: true }];
        const walk = (prefix, depth) => {
            const entry = tree[prefix];
            if (!entry?.folders.length)
                return;
            for (const child of entry.folders) {
                const childEntry = tree[child];
                rows.push({
                    prefix: child,
                    depth,
                    expandable: !childEntry?.loaded || childEntry.folders.length > 0,
                });
                if (open[child])
                    walk(child, depth + 1);
            }
        };
        if (open[""] !== false)
            walk("", 1);
        return rows;
    }, `${name}.treeRows`);
    onUpdate(storageState.bucket, (ctx) => treeFocus(ctx, null));
    onUpdate(storageState.isOpen, (ctx, isOpen) => {
        if (!isOpen)
            selected(ctx, []);
    });
    onConnect(lightbox, (ctx) => {
        if (typeof window === "undefined")
            return;
        const onKeyDown = (event) => {
            if (event.key === "Escape" && ctx.get(lightbox)) {
                lightbox(ctx, null);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });
    const actions = {
        setSearch: action((ctx, value) => search(ctx, value), `${name}.setSearch`),
        setSort: action((ctx, value) => sort(ctx, value), `${name}.setSort`),
        toggleSortDir: action((ctx) => sortDir(ctx, ctx.get(sortDir) === "asc" ? "desc" : "asc"), `${name}.toggleSortDir`),
        toggleViewMode: action((ctx) => viewMode(ctx, ctx.get(viewMode) === "list" ? "grid" : "list"), `${name}.toggleViewMode`),
        toggleTreeVisible: action((ctx) => treeVisible(ctx, !ctx.get(treeVisible)), `${name}.toggleTreeVisible`),
        selectObject: action((ctx, key) => {
            if (multiple) {
                const current = ctx.get(selected);
                if (current.includes(key)) {
                    selected(ctx, current.filter((item) => item !== key));
                    return;
                }
                if (maxSelected && current.length >= maxSelected)
                    return;
                selected(ctx, [...current, key]);
                return;
            }
            if (selectionMode === "immediate") {
                onSelectFile?.(ctx, key);
                storageState.isOpen(ctx, false);
                return;
            }
            const current = ctx.get(selected);
            selected(ctx, current[0] === key ? [] : [key]);
        }, `${name}.selectObject`),
        clearSelection: action((ctx) => selected(ctx, []), `${name}.clearSelection`),
        confirmSelection: action((ctx) => {
            const keys = ctx.get(selected);
            if (keys.length === 0)
                return;
            if (multiple)
                onSelectFiles?.(ctx, keys);
            else
                onSelectFile?.(ctx, keys[0]);
            storageState.isOpen(ctx, false);
        }, `${name}.confirmSelection`),
        openPreview: action((ctx, params) => {
            const url = ctx.get(storage.previews)[previewKey(params.bucket, params.key)];
            if (url) {
                lightbox(ctx, url);
                return;
            }
            if (previews)
                storage.loadPreview(ctx, params);
        }, `${name}.openPreview`),
        closePreview: action((ctx) => lightbox(ctx, null), `${name}.closePreview`),
        setTreeFocus: action((ctx, prefix) => treeFocus(ctx, prefix), `${name}.setTreeFocus`),
        /**
         * Arrow-key navigation for the folder tree (WAI-ARIA tree pattern).
         * Returns true when the key was handled.
         */
        onTreeKeyDown: action((ctx, key) => {
            const rows = ctx.get(treeRows);
            if (rows.length === 0)
                return false;
            const focused = ctx.get(treeFocus);
            const index = Math.max(0, rows.findIndex((row) => row.prefix === focused));
            const row = rows[index];
            const prefix = row.prefix;
            const open = ctx.get(storageState.treeOpen)[prefix] ?? false;
            const focus = (next) => {
                const target = rows[Math.min(Math.max(next, 0), rows.length - 1)];
                treeFocus(ctx, target.prefix);
                return true;
            };
            switch (key) {
                case "ArrowDown":
                    return focus(index + 1);
                case "ArrowUp":
                    return focus(index - 1);
                case "Home":
                    return focus(0);
                case "End":
                    return focus(rows.length - 1);
                case "ArrowRight":
                    if (!row.expandable)
                        return true;
                    if (!open) {
                        storage.toggleTree(ctx, prefix);
                        return true;
                    }
                    return focus(index + 1);
                case "ArrowLeft":
                    if (open) {
                        storage.toggleTree(ctx, prefix);
                        return true;
                    }
                    if (prefix === "")
                        return true;
                    return focus(rows.findIndex((candidate) => candidate.prefix === parentPrefix(prefix)));
                case "Enter":
                case " ":
                    storage.openFolder(ctx, prefix);
                    return true;
                default:
                    return false;
            }
        }, `${name}.onTreeKeyDown`),
    };
    return {
        labels,
        formatDate,
        previews,
        selectionMode,
        multiple,
        maxSelected,
        onSelectFile,
        onSelectFiles,
        search,
        sort,
        sortDir,
        viewMode,
        selected,
        lightbox,
        treeVisible,
        treeFocus,
        treeRows,
        list,
        actions,
    };
};
//# sourceMappingURL=index.js.map