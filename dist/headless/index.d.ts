import { type Ctx } from "@reatom/framework";
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
export declare const defaultStorageLabels: StorageLabels;
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
export declare const folderName: (prefix: string) => string;
/**
 * Framework-agnostic view state shared by the React and Solid adapters.
 * Rendering lives in `@projectfasberry/storage/react` (or another binding);
 * filtering, sorting, selection and the preview lightbox live here.
 */
export declare const createStorageBrowser: ({ name, storage, storageState, onSelectFile, labels: labelOverrides, formatDate, previews, selectionMode, defaultViewMode, showTree, }: StorageBrowserOptions) => {
    labels: {
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
    formatDate: (value: string, kind: "object" | "bucket") => string;
    previews: boolean;
    selectionMode: StorageSelectionMode;
    onSelectFile: ((ctx: Ctx, fileName: string) => void) | undefined;
    search: import("@reatom/framework").AtomMut<string>;
    sort: import("@reatom/framework").AtomMut<StorageSortKey>;
    sortDir: import("@reatom/framework").AtomMut<StorageSortDir>;
    viewMode: import("@reatom/framework").AtomMut<StorageViewMode>;
    selected: import("@reatom/framework").AtomMut<string | null>;
    lightbox: import("@reatom/framework").AtomMut<string | null>;
    treeVisible: import("@reatom/framework").AtomMut<boolean>;
    list: import("@reatom/framework").Atom<{
        folders: string[];
        objects: import("../core").StorageObject[];
    }>;
    actions: {
        setSearch: import("@reatom/framework").Action<[value: string], string>;
        setSort: import("@reatom/framework").Action<[value: StorageSortKey], StorageSortKey>;
        toggleSortDir: import("@reatom/framework").Action<[], StorageSortDir>;
        toggleViewMode: import("@reatom/framework").Action<[], StorageViewMode>;
        toggleTreeVisible: import("@reatom/framework").Action<[], boolean>;
        selectObject: import("@reatom/framework").Action<[key: string], void>;
        clearSelection: import("@reatom/framework").Action<[], string | null>;
        confirmSelection: import("@reatom/framework").Action<[], void>;
        openPreview: import("@reatom/framework").Action<[params: {
            bucket: string;
            key: string;
        }], void>;
        closePreview: import("@reatom/framework").Action<[], string | null>;
    };
};
export type StorageBrowser = ReturnType<typeof createStorageBrowser>;
//# sourceMappingURL=index.d.ts.map