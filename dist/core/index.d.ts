/** Minimal shape of an S3-compatible bucket and object. */
export type StorageBucket = {
    name: string;
    creationDate: string;
    /** False when the bucket exists in the list but cannot be opened. */
    available?: boolean;
};
export type StorageObject = {
    key: string;
    size?: number;
    lastModified?: string;
    eTag?: string;
};
export type StorageObjectPage = {
    contents?: StorageObject[];
    /** Virtual folders returned by S3 when a delimiter is used. */
    commonPrefixes?: {
        prefix: string;
    }[];
    isTruncated?: boolean;
    nextContinuationToken?: string;
};
export type StorageListOptions = {
    folder?: string;
    delimiter?: string;
    continuationToken?: string;
};
/**
 * The only thing an app has to provide: a few calls that match the
 * `/privated/volume/*` API design. The model stays independent from any HTTP
 * client, so another web app can bind its own transport.
 */
export type StorageApi = {
    listBuckets(): Promise<StorageBucket[]>;
    getBucket(bucket: string): Promise<unknown>;
    listObjects(bucket: string, options?: StorageListOptions): Promise<StorageObjectPage>;
    /** Short-lived URL for private buckets; public buckets can omit it. */
    presign?(bucket: string, key: string): Promise<string>;
};
export type StorageSection = "buckets-list" | "bucket-list";
export type StorageTreeEntry = {
    folders: string[];
    loaded: boolean;
    loading: boolean;
    error: string | null;
};
type ListObjectsParams = {
    bucket: string;
    folder?: string;
    continuationToken?: string;
    append?: boolean;
};
export declare const createStorageModel: ({ name, api }: {
    name: string;
    api: StorageApi;
}) => {
    storageState: import("@reatom/framework").AtomMut<null> & {
        isOpen: import("@reatom/framework").AtomMut<boolean>;
        section: import("@reatom/framework").AtomMut<StorageSection> & {
            reset: import("@reatom/framework").Action<[], StorageSection>;
        };
        bucket: import("@reatom/framework").AtomMut<string | null> & {
            reset: import("@reatom/framework").Action<[], string | null>;
        };
        /** S3 prefix of the open folder; empty at the bucket root. */
        folder: import("@reatom/framework").AtomMut<string> & {
            reset: import("@reatom/framework").Action<[], string>;
        };
        nextToken: import("@reatom/framework").AtomMut<string | null>;
        append: import("@reatom/framework").AtomMut<boolean>;
        tree: import("@reatom/framework").AtomMut<Record<string, StorageTreeEntry>>;
        treeOpen: import("@reatom/framework").AtomMut<Record<string, boolean>>;
    };
    storage: import("@reatom/framework").AtomMut<null> & {
        listBuckets: import("@reatom/framework").AsyncAction<any[], StorageBucket[]> & {
            dataAtom: import("@reatom/framework").AsyncDataAtom<StorageBucket[] | null>;
        } & {
            statusesAtom: import("@reatom/framework").AsyncStatusesAtom;
        } & {
            errorAtom: import("@reatom/framework").AtomMut<Error | undefined> & {
                reset: import("@reatom/framework").Action;
            };
        };
        getBucket: import("@reatom/framework").AsyncAction<[bucket: string], unknown> & {
            dataAtom: import("@reatom/framework").AsyncDataAtom<unknown>;
        } & {
            cacheAtom: import("@reatom/framework").CacheAtom<unknown, [bucket: string]>;
            swrPendingAtom: import("@reatom/framework").Atom<number>;
        } & {
            statusesAtom: import("@reatom/framework").AsyncStatusesAtom;
        } & {
            errorAtom: import("@reatom/framework").AtomMut<Error | undefined> & {
                reset: import("@reatom/framework").Action;
            };
        };
        listObjects: import("@reatom/framework").AsyncAction<[params: ListObjectsParams], StorageObjectPage> & {
            dataAtom: import("@reatom/framework").AsyncDataAtom<StorageObjectPage | null>;
        } & {
            statusesAtom: import("@reatom/framework").AsyncStatusesAtom;
        } & {
            errorAtom: import("@reatom/framework").AtomMut<Error | undefined> & {
                reset: import("@reatom/framework").Action;
            };
        };
        previews: import("@reatom/framework").AtomMut<Record<string, string>>;
        loadPreview: import("@reatom/framework").AsyncAction<[params: {
            bucket: string;
            key: string;
        }], {
            key: string;
            url: string;
        } | null> & {
            statusesAtom: import("@reatom/framework").AsyncStatusesAtom;
        };
        fetchTree: import("@reatom/framework").AsyncAction<[prefix: string], {
            prefix: string;
            folders: string[];
            error: null;
        } | {
            prefix: string;
            folders: never[];
            error: string;
        }> & {
            statusesAtom: import("@reatom/framework").AsyncStatusesAtom;
        };
        selectBucket: import("@reatom/framework").Action<[bucket: string], void>;
        openFolder: import("@reatom/framework").Action<[prefix: string], void>;
        /** Folder up, then buckets, then close the panel. */
        goBack: import("@reatom/framework").Action<[], void>;
        /**
         * Loads the data for the current section. The view calls it from an
         * effect on its own provider context: an action started from a
         * component context is aborted when that component unmounts, which
         * happens exactly when a bucket replaces the bucket list.
         */
        load: import("@reatom/framework").Action<[], void>;
        loadMore: import("@reatom/framework").Action<[], void>;
        loadTree: import("@reatom/framework").Action<[prefix: string], void>;
        toggleTree: import("@reatom/framework").Action<[prefix: string], void>;
    };
};
export type StorageModel = ReturnType<typeof createStorageModel>["storage"];
export type StorageState = ReturnType<typeof createStorageModel>["storageState"];
export {};
//# sourceMappingURL=index.d.ts.map