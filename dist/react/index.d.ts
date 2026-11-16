import { type Ctx } from "@reatom/framework";
import type { StorageModel, StorageState } from "../core";
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
export declare const defaultStorageLabels: StorageLabels;
export type StorageViewOptions = {
    name: string;
    storage: StorageModel;
    storageState: StorageState;
    onSelectFile?: (ctx: Ctx, fileName: string) => void;
    labels?: Partial<StorageLabels>;
    formatDate?: (value: string, kind: "object" | "bucket") => string;
    className?: string;
};
export declare function createStorageView({ name, storage, storageState, onSelectFile, labels: labelOverrides, formatDate, className, }: StorageViewOptions): {
    StorageContent: (props: object) => JSX.Element;
};
//# sourceMappingURL=index.d.ts.map