# @projectfasberry/storage

Reatom model, headless browser state and a React view for an S3-compatible
storage browser. The core and headless entries are framework-agnostic; React is
one binding, a Solid adapter can use the same state.

## Install

```bash
npm install @projectfasberry/storage @reatom/framework @reatom/npm-react react react-dom
```

## Core

```ts
import { createStorageModel } from "@projectfasberry/storage"

const { storage, storageState } = createStorageModel({
  name: "media",
  api: {
    listBuckets: () => fetch("/buckets").then((r) => r.json()),
    getBucket: (bucket) => fetch(`/buckets/${bucket}`).then((r) => r.json()),
    listObjects: (bucket, options) =>
      fetch(`/buckets/${bucket}/list?folder=${options?.folder ?? ""}`).then((r) => r.json()),
    presign: (bucket, key) =>
      fetch(`/buckets/${bucket}/presign?key=${key}`).then((r) => r.json()),
  },
})
```

`StorageApi` is the only coupling. `listObjects` supports `folder`,
`delimiter` and `continuationToken`; the response follows the S3 list shape
(`contents`, `commonPrefixes`, `nextContinuationToken`).

## Headless state

`@projectfasberry/storage/headless` holds the view state shared by UI adapters:
search, sorting, list/grid mode, recursive folder tree, selection, pagination
and the preview lightbox. It has no React dependency.

```ts
import { createStorageBrowser } from "@projectfasberry/storage/headless"

const browser = createStorageBrowser({ name: "media", storage, storageState })
browser.actions.setSearch(ctx, "logo")
ctx.spy(browser.list) // { folders, objects }
```

## React

```tsx
import { createStorageView } from "@projectfasberry/storage/react"

const { StorageContent } = createStorageView({
  name: "media",
  storage,
  storageState,
  onSelectFile: (ctx, key) => console.log(key),
  previews: true,            // false = file icons, no presigned thumbnails
  selectionMode: "confirm",  // footer with Select / Cancel
  showTree: true,            // recursive folder tree
})
```

`StorageContent` is the browser itself; render it inside your own dialog,
drawer or page. Labels and date formatting are props.

## Features

- bucket list, breadcrumbs, search and sorting;
- recursive lazy folder tree;
- list and grid views, image previews and a lightbox;
- file-type icons (image, text, code, archive, audio, video, generic file);
- pagination with `nextContinuationToken`;
- keyboard and screen-reader friendly controls;
- labels, date formatting and previews are configurable.

## Tailwind

The React view uses Tailwind utility classes. With Tailwind v4 add the package
source to your CSS:

```css
@source "../node_modules/@projectfasberry/storage/dist/**/*.js";
```

## License

MIT
