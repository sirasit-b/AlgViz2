# AGENTS.md

## Project overview

This repository is a static PHP-based visualizer site for algorithms and data structures. The main project docs are:

- [README.md](README.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)

Use those files as the canonical references for product scope, architecture, and contributor workflow.

## Critical conventions

- Source of truth is under [src/](src/). Edit there first.
- Generated outputs under [assets/](assets/), [config/topics.php](config/topics.php), and [preview.html](preview.html) are build artifacts and should not be edited by hand.
- After changing anything under [src/](src/), run the build before testing or finishing work:

```bash
node build/build.mjs
```

- For browser verification, run the dev server:

```bash
php -S 127.0.0.1:8088 -t . router.php
```

- Docker is also supported for local serving:

```bash
docker compose up -d --build
docker compose logs -f web
```

## Architecture and workflow

- [build/build.mjs](build/build.mjs) compiles source files into generated assets and auto-generates metadata.
- Each visualizer is registered with `AlgoViz.register({...})` in a file under [src/content/](src/content/) or in [src/core.body.html](src/core.body.html).
- New topic metadata is generated automatically; no manual wiring is required beyond registering the module correctly.
- Keep topic IDs, categories, and renderer names consistent with the existing taxonomy and renderer system.

## Safe editing guidance

- Prefer changes in the source folders and hand-authored PHP/config files only when the work clearly requires it.
- Do not manually edit generated files unless the task is intentionally rebuilding them.
- If a task adds a new visualizer, ensure it follows the examples and validation steps described in [CONTRIBUTING.md](CONTRIBUTING.md).

## Git workflow

- Work from a feature branch off `dev`.
- Do not push directly to `main`.
- Open a pull request into `dev` after validation.

## Useful commands

```bash
# Rebuild generated files after source edits
node build/build.mjs

# Local preview
php -S 127.0.0.1:8088 -t . router.php

# Docker workflow
# build assets from src/
docker compose run --rm build
# serve the app
docker compose up -d --build
```

## When in doubt

Follow the docs in [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md) before introducing new patterns or touching generated files.
