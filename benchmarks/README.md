# Benchmarks

This folder is intended to hold benchmark scripts comparing Rimmel rendering speed and memory usage to other libraries.

What to include
- Microbenchmarks: simple component update throughput (ops/sec), average latency for updates, memory allocation per update.
- Medium benchmarks: a data-grid update scenario with 1k rows and frequent updates.
- Comparative harness: scripts to run the same scenario using React/Vue/Svelte for apples-to-apples comparison.

How to run (example)

```bash
cd benchmarks
npm install        # install any local benchmark helpers
node run-micro.js  # example script
```

I can scaffold a basic microbenchmark (Node + puppeteer/light browser harness) and CI job to run it and publish results if you want.
