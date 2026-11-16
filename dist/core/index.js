import { action, atom, reatomAsync, withAssign, withCache, withDataAtom, withErrorAtom, withReset, withStatusesAtom, } from "@reatom/framework";
const previewKey = (bucket, key) => `${bucket}/${key}`;
export const createStorageModel = ({ name, api }) => {
    const storageState = atom(null, `${name}.storageState`).pipe(withAssign((_, name) => ({
        isOpen: atom(false, `${name}.isOpen`),
        section: atom("buckets-list", `${name}.section`).pipe(withReset()),
        bucket: atom(null, `${name}.bucket`).pipe(withReset()),
        /** S3 prefix of the open folder; empty at the bucket root. */
        folder: atom("", `${name}.folder`).pipe(withReset()),
    })));
    const previews = atom({}, `${name}.previews`);
    const storage = atom(null, `${name}.storage`).pipe(withAssign((_, name) => ({
        listBuckets: reatomAsync(async () => api.listBuckets(), `${name}.listBuckets`).pipe(withDataAtom(null), withStatusesAtom(), withErrorAtom()),
        getBucket: reatomAsync(async (_, bucket) => api.getBucket(bucket), `${name}.getBucket`).pipe(withDataAtom(null), withCache({ swr: false }), withStatusesAtom(), withErrorAtom()),
        listObjects: reatomAsync(async (_, params) => api.listObjects(params.bucket, { folder: params.folder, delimiter: "/" }), `${name}.listObjects`).pipe(withDataAtom(null), withStatusesAtom(), withErrorAtom()),
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
        selectBucket: action((ctx, bucket) => {
            storageState.bucket(ctx, bucket);
            storageState.folder(ctx, "");
            storageState.section(ctx, "bucket-list");
        }, `${name}.selectBucket`),
        openFolder: action((ctx, prefix) => {
            storageState.folder(ctx, prefix);
        }, `${name}.openFolder`),
        /** Folder up, then buckets, then close the panel. */
        goBack: action((ctx) => {
            const folder = ctx.get(storageState.folder);
            if (folder) {
                const parent = folder.replace(/\/$/, "").split("/").slice(0, -1).join("/");
                storageState.folder(ctx, parent ? `${parent}/` : "");
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
            storage.listObjects(ctx, { bucket, folder: ctx.get(storageState.folder) });
        }, `${name}.load`),
    })));
    return { storageState, storage };
};
//# sourceMappingURL=index.js.map