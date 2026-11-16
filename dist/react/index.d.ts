import { defaultStorageLabels, type StorageBrowserOptions, type StorageLabels, type StorageViewMode } from "../headless";
export { defaultStorageLabels };
export type { StorageLabels, StorageViewMode };
export type StorageViewOptions = StorageBrowserOptions & {
    className?: string;
};
export declare function createStorageView(options: StorageViewOptions): {
    StorageContent: (props: object) => JSX.Element;
};
//# sourceMappingURL=index.d.ts.map