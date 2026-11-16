# @projectfasberry/storage

Reatom model and React view for an S3-compatible storage browser. The model
knows only about a small `StorageApi`; the view is a separate entry so the core
can be used with any Reatom binding.

## Install

```bash
npm install @projectfasberry/storage @reatom/framework @reatom/npm-react react
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

`StorageApi` is the only coupling: `listBuckets`, `getBucket`, `listObjects`
and an optional `presign`. `listObjects` returns `contents` and
`commonPrefixes` (the S3 list shape).

## React

```tsx
import { createStorageView } from "@projectfasberry/storage/react"

const { StorageContent } = createStorageView({
  name: "media",
  storage,
  storageState,
  onSelectFile: (ctx, key) => console.log(key),
})

return <StorageContent />
```

`createStorageView` is headless about the shell: render `StorageContent` inside
your own dialog, drawer or page. Labels and date formatting are props, so the
package does not hardcode a locale.

## Tailwind

The view uses Tailwind utility classes. With Tailwind v4 add the package source
to your CSS so the classes are generated:

```css
@source "../node_modules/@projectfasberry/storage/dist/**/*.js";
```

## License

MIT
