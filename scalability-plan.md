# Scalability Plan for Structure Architecture

## Horizontal Scaling
- **Stateless Architecture**: By shifting processing exclusively to the client-side (local browser execution), the core application infrastructure can handle an unlimited number of concurrent users without increasing server compute load.
- **CDN Edge Delivery**: Static assets (HTML, CSS, JS bundles) can be distributed globally via edge nodes to minimize latency for users worldwide.
- **Worker Pools (Future)**: The application can dynamically instantiate multiple Web Workers in the user's browser, distributing hashing tasks across all available CPU cores of the user's machine.

## Vertical Scaling
- **Memory Optimization**: Current local operations require high RAM when processing vast directory structures. Future updates can optimize tree-traversal and streaming file readers (using `ReadableStream` instead of loading entire `ArrayBuffer`s into memory) to limit active RAM spikes.
- **IndexedDB Tiering**: Shifting state management from transient React memory/LocalStorage into IndexedDB will raise the upper limit on file inventory sizes before a client's tab crashes (currently constrained by standard V8 heap limits).

## Potential Bottlenecks
- **Browser Memory Constraints**: Reading massive file blobs in-memory for SHA-256 calculations can exceed browser heap limits on large video files.
- **Local Storage Limitations**: LocalStorage caps at ~5MB, which will break persistence for inventories scaling past ~20,000 files.
- **DOM Rendering Performance**: Displaying and interacting with a table listing 50,000+ files causes heavy DOM thrashing.

## Required Infrastructure
- **Virtualization Support**: Implementation of library-level virtualization (e.g., `react-virtualized` or `@tanstack/react-virtual`) to render DOM nodes exclusively for visible files.
- **Streaming Handlers**: A migration to chunk-based crypto-hashing within Web Workers to prevent blocking the main UI thread or consuming excessive memory.
