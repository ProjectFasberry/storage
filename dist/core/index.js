import { action, atom, reatomAsync, withAssign, withCache, withDataAtom, withErrorAtom, withReset, withStatusesAtom, } from "@reatom/framework";
const previewKey = (bucket, key) => `${bucket}/${key}`;
const emptyTreeEntry = () => ({
    folders: [],
    loaded: false,
    loading: false,
    error: null,
});
export const createStorageModel = ({ name, api }) => {
    const storageState = atom(null, `${name}.storageState`).pipe(withAssign((_, name) => ({
        isOpen: atom(false, `${name}.isOpen`),
        section: atom("buckets-list", `${name}.section`).pipe(withReset()),
        bucket: atom(null, `${name}.bucket`).pipe(withReset()),
        /** S3 prefix of the open folder; empty at the bucket root. */
        folder: atom("", `${name}.folder`).pipe(withReset()),
        nextToken: atom(null, `${name}.nextToken`),
        append: atom(false, `${name}.append`),
        tree: atom({}, `${name}.tree`),
        treeOpen: atom({ "": true }, `${name}.treeOpen`),
    })));
    const previews = atom({}, `${name}.previews`);
    const storage = atom(null, `${name}.storage`).pipe(withAssign((_, name) => ({
        listBuckets: reatomAsync(async () => api.listBuckets(), `${name}.listBuckets`).pipe(withDataAtom(null), withStatusesAtom(), withErrorAtom()),
        getBucket: reatomAsync(async (_, bucket) => api.getBucket(bucket), `${name}.getBucket`).pipe(withDataAtom(null), withCache({ swr: false }), withStatusesAtom(), withErrorAtom()),
        listObjects: reatomAsync(async (_, params) => api.listObjects(params.bucket, {
            folder: params.folder,
            delimiter: "/",
            continuationToken: params.continuationToken,
        }), `${name}.listObjects`).pipe(withDataAtom(null, (ctx, page, state) => {
            if (!page)
                return null;
            if (!ctx.get(storageState.append))
                return page;
            return {
                ...page,
                contents: [...(state?.contents ?? []), ...(page.contents ?? [])],
                commonPrefixes: [...(state?.commonPrefixes ?? []), ...(page.commonPrefixes ?? [])],
            };
        }), withStatusesAtom(), withErrorAtom()),
        previews,
        loadPreview: reatomAsync(async (_, params) => {
            if (!api.presign)
                return null;
            return {
                key: previewKey(params.bucket, params.key),
                url: await api.presign(params.bucket, params.key),
            };
        }, {
            name: `${name}.loadPreview`,
            onFulfill: (ctx, result) => {
                if (!result)
                    return;
                previews(ctx, (state) => ({ ...state, [result.key]: result.url }));
            },
        }).pipe(withStatusesAtom()),
        fetchTree: reatomAsync(async (ctx, prefix) => {
            const bucket = ctx.get(storageState.bucket);
            if (!bucket)
                return { prefix, folders: [], error: null };
            try {
                const page = await api.listObjects(bucket, { folder: prefix, delimiter: "/" });
                return {
                    prefix,
                    folders: page.commonPrefixes?.map(({ prefix: child }) => child) ?? [],
                    error: null,
                };
            }
            catch (error) {
                return {
                    prefix,
                    folders: [],
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        }, `${name}.fetchTree`).pipe(withStatusesAtom()),
        selectBucket: action((ctx, bucket) => {
            storageState.bucket(ctx, bucket);
            storageState.folder(ctx, "");
            storageState.section(ctx, "bucket-list");
            storageState.nextToken(ctx, null);
            storageState.append(ctx, false);
            storageState.tree(ctx, {});
            storageState.treeOpen(ctx, { "": true });
        }, `${name}.selectBucket`),
        openFolder: action((ctx, prefix) => {
            storageState.folder(ctx, prefix);
            storageState.nextToken(ctx, null);
            storageState.append(ctx, false);
        }, `${name}.openFolder`),
        /** Folder up, then buckets, then close the panel. */
        goBack: action((ctx) => {
            const folder = ctx.get(storageState.folder);
            if (folder) {
                const parent = folder.replace(/\/$/, "").split("/").slice(0, -1).join("/");
                storageState.folder(ctx, parent ? `${parent}/` : "");
                storageState.nextToken(ctx, null);
                storageState.append(ctx, false);
                return;
            }
            if (ctx.get(storageState.section) === "bucket-list") {
                storageState.section(ctx, "buckets-list");
                return;
            }
            storageState.isOpen(ctx, false);
        }, `${name}.goBack`),
        /**
         * Loads the data for the current section. The view calls it from an
         * effect on its own provider context: an action started from a
         * component context is aborted when that component unmounts, which
         * happens exactly when a bucket replaces the bucket list.
         */
        load: action((ctx) => {
            if (ctx.get(storageState.section) === "buckets-list") {
                storage.listBuckets(ctx);
                return;
            }
            const bucket = ctx.get(storageState.bucket);
            if (!bucket)
                return;
            storageState.nextToken(ctx, null);
            storageState.append(ctx, false);
            storage.listObjects(ctx, { bucket, folder: ctx.get(storageState.folder) });
        }, `${name}.load`),
        loadMore: action((ctx) => {
            const token = ctx.get(storageState.nextToken);
            const bucket = ctx.get(storageState.bucket);
            if (!token || !bucket)
                return;
            storage.listObjects(ctx, {
                bucket,
                folder: ctx.get(storageState.folder),
                continuationToken: token,
                append: true,
            });
        }, `${name}.loadMore`),
        loadTree: action((ctx, prefix) => {
            const entry = ctx.get(storageState.tree)[prefix];
            if (entry?.loaded || entry?.loading)
                return;
            storage.fetchTree(ctx, prefix);
        }, `${name}.loadTree`),
        toggleTree: action((ctx, prefix) => {
            const open = ctx.get(storageState.treeOpen);
            const next = !open[prefix];
            storageState.treeOpen(ctx, { ...open, [prefix]: next });
            if (next)
                storage.loadTree(ctx, prefix);
        }, `${name}.toggleTree`),
    })));
    storage.listObjects.onCall((ctx, _promise, params) => {
        storageState.append(ctx, !!params[0]?.append);
    });
    storage.listObjects.onFulfill.onCall((ctx, page) => {
        storageState.nextToken(ctx, page?.nextContinuationToken ?? null);
    });
    storage.fetchTree.onCall((ctx, _promise, params) => {
        const [prefix] = params;
        const tree = ctx.get(storageState.tree);
        storageState.tree(ctx, {
            ...tree,
            [prefix]: { ...(tree[prefix] ?? emptyTreeEntry()), loading: true, error: null },
        });
    });
    storage.fetchTree.onFulfill.onCall((ctx, result) => {
        const tree = ctx.get(storageState.tree);
        storageState.tree(ctx, {
            ...tree,
            [result.prefix]: {
                folders: result.folders,
                loaded: !result.error,
                loading: false,
                error: result.error,
            },
        });
    });
    return { storageState, storage };
};
//# sourceMappingURL=index.js.map