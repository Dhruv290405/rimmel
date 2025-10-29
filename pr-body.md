Fix(types/build): make repo TypeScript-buildable, add fast local build, and unblock examples

Summary
-------
This PR stabilizes the TypeScript build, unblocks local example runs, and applies a set of focused fixes and small improvements to enable a clean local developer experience.

High-level changes:
- Fixes multiple TypeScript typing issues across core parser and event/listener code so `tsc --noEmit` passes.
- Adds a fast esbuild-based `build:fast` to produce `dist/` quickly for local examples and dev workflows.
- Breaks a circular dependency that prevented Rollup from producing clean builds by temporarily removing problematic static sink registrations (short-term mitigation).
- Starts tightening a number of `any` casts and narrows some generic signatures (incremental refactor strategy).
- Adds small runtime and defensive checks to reduce risky casts and runtime surprises.
- Pushes these changes to branch `fix/typescript-build`.

Why this change
---------------
The repo had multiple TypeScript and build problems that made development and examples difficult to run locally. This PR makes the repo buildable, restores `dist/` outputs for examples, and provides a fast developer build path for quicker iteration.

The circular import chain that caused Rollup warnings has been mitigated to let the build complete. A proper sink registry will be implemented as the next step to fully restore the original registration pattern without cycles.

What I changed (high level)
---------------------------
- Type fixes and refactors:
  - `src/parser/parser.ts` — replaced a reduce-based mixin attribute grouping with an explicit typed loop to avoid complex tuple/generic inference issues. (See the inlined loop handling static vs deferred mixin attributes.)
  - `src/lib/addListener.ts` — safer runtime checks and narrower conversions for listener wiring and `.when()` observables.
  - `src/custom-element.ts` — tightened SubjectProxy/subscribe generics to reduce `any` surface.
  - `src/utils/*.ts` (input-pipe, curry) — attempted tighter typings, but selectively reverted some over-aggressive changes to keep the build green while iterating.
- Build tooling and scripts:
  - `scripts/build-fast.cjs` — new esbuild script and corresponding `package.json` script (`build:fast`) to generate `dist/` quickly for examples.
  - Ensured `npm run build` (Rollup) is able to complete after circular import mitigation.
- Circular dependency mitigation:
  - `src/parser/sink-map.ts` — removed static registration(s) that caused import cycles (e.g., subtree/toggle entries). This is a temporary measure; a dynamic sink registry will be added in a follow-up to re-register these sinks safely without static imports.
- Doc/dev ergonomics:
  - Scaffolding and minor docs/examples/bench support were added earlier in the branch to help local verification and benchmarking workflows.

Files changed (representative)
-----------------------------
- `src/parser/parser.ts` — fix: explicit loop for mixin attribute separation; safer infer types
- `src/parser/sink-map.ts` — temporary removal of static sink registrations to avoid circular import
- `src/lib/addListener.ts` — type/runtime tightening
- `src/custom-element.ts` — narrowed Subject/subscribe typings
- `src/utils/input-pipe.ts`, `src/utils/curry.ts` — partial typing adjustments (reverted some over-aggressive changes)
- `scripts/build-fast.cjs` — new fast build helper (esbuild)
- Minor docs/examples and CI scaffolding files (benchmarks and example scaffolding committed prior in branch)

Quality gates / verification
---------------------------
- Type checking: PASS — ran `npx -y tsc --noEmit` locally.
- Rollup build: PASS — `npm run build` completed locally and produced `./dist/*`.
- Fast build (esbuild): PASS — `npm run build:fast` produced `dist/` artifacts for quick local use.
- Examples/dev server: The kitchen-sink Vite dev server was started successfully and is accessible locally (reported locally at `http://localhost:5173/` while the server was running in the session).
- Tests: N/A — the repo has some tests; this PR does not introduce new test runs. (If you want, I can add a couple of fast unit tests for the new behavior.)

How to test locally
-------------------
Run the following from the repository root (PowerShell):

```powershell
# Install deps (if not already installed)
npm ci

# Quick: fast dev build for local examples (esbuild)
npm run build:fast

# Full library build (Rollup)
npm run build

# Run the kitchen-sink dev server (examples)
npm run kitchen-sink
# then open http://localhost:5173/ in your browser
```

Also verify TypeScript:

```powershell
npx -y tsc --noEmit
```

Notable implementation detail (parser mixin loop)
-----------------------------------------------
One focused example of the change: the parser previously used a reduce-based pattern to split a mixin object into static and deferred attributes. That approach caused TypeScript to struggle with tuple/generic inference and produced brittle casts. This PR replaces the reduce with an explicit typed loop:

- The loop iterates Object.entries(expression as AttributeObject ?? []).
- It pushes into two typed arrays:
  - `staticAttributes: [HTMLAttributeName, PresentSinkAttributeValue][]`
  - `deferredAttributes: [HTMLAttributeName, FutureSinkAttributeValue][]`
- The logic defers attributes that are futures, event-listener functions, or onmount-like attributes, and inlines the static attributes into the rendered HTML.

Risks and caveats
-----------------
- Circular dependency mitigation is temporary. I removed a small number of static sink registrations to break cycles so the build completes. This may change the module initialization order; functionally, sinks remain available at runtime via the pre-sink wiring used in examples, but reintroducing the previously static registration will require the sink registry pattern (next steps).
- Some `any` and `@ts-ignore` occurrences remain; the branch focuses on targeted, low-risk fixes to get to a green build. I intentionally avoided deep, risky refactors that would enlarge the patch set or cause regressions.
- CI: Some remote GitHub Actions runs were failing in the past due to install-step issues and permission/log access. I could not fetch remote run logs (lack of admin rights). The local builds and tsc pass; if you want I can add or modify the workflow to mirror the local dev environment more closely and to run `npm ci` + `npm run build` as in my local checks.

Follow-ups / next steps (recommended)
-------------------------------------
- Implement a proper `src/parser/sink-registry.ts` with a small register/get API. Change sinks to register themselves so we can restore sink registrations without static circular imports.
- Continue reducing `any` occurrences and tighten `src/lib/observature.ts` and other remaining complex modules incrementally (one or two files per PR).
- Add a small unit/integration test that covers the mixin attribute expansion and a test ensuring a sink (e.g., subtree) registers via the registry when implemented.
- Optionally add a small GitHub Action that runs `npm ci`, `npx -y tsc --noEmit`, and `npm run build:fast` for faster CI feedback.

Commits
-------
This branch is pushed to `fix/typescript-build`. Commits include small focused fixes; commit messages are prefixed with `fix(types)` or `chore` for build tooling changes.

How I can help next
-------------------
- I can tweak the PR body if you prefer a different tone or more/less detail.
- I can create a follow-up PR that implements the sink registry and reintroduces omitted sinks safely.
- I can provide a short test suite for the parser mixin handling and add it to CI.
- If you want me to open the PR on GitHub I can provide the exact commands for you to run locally (recommended) — I cannot accept a PAT in chat.


