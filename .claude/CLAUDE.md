# Skymmich Project

This file provides context for working with the Skymmich project.

## Common Commands

- `npm run dev`: Starts the development server, frontend, and worker.
- `npm run build`: Builds the project for production.
- `npm run check`: Runs the TypeScript type checker.
- `npm run docker:build`: Builds the Docker image.
- `npm run docker:run`: Runs the application using Docker Compose.
- `npm run docker:stop`: Stops the application running in Docker.

## Project Structure

- `apps/client`: Contains the React frontend application.
- `apps/server`: Contains the Hono backend server.
- `packages/shared`: Contains shared code between the client and server.
- `tools/migrations`: Contains database migrations.

## Code Style

- Use ES modules (import/export) syntax.
- Follow existing code style and conventions.

## Available Bash Tools
- `gh` for github cli (prs, issues, etc)
- `jq` for JSON processing
- `yq` for yaml processing

## Workflow

- When making changes, ensure they pass the type checker (`npm run check`).
- For significant changes, consider adding or updating tests.

## Releases

Releases are driven by git tags. Do not create releases manually with `gh release create`.

1. Bump the version in `package.json`.
2. Add a changelog entry to `CHANGELOG.md` under a new version heading.
3. Commit and push to main.
4. Create and push a semver tag: `git tag v<version> && git push origin v<version>`.
5. The `release.yml` workflow handles everything else: builds, security scan, multi-arch Docker image push (with `latest`, semver, and major/minor tags), SBOM generation, and GitHub release creation with artifacts.

The `docker-build-push.yml` workflow runs on every push to main and publishes intermediate Docker images (`main`, `sha-*`, timestamp tags). It prunes old non-release images automatically after each build. The weekly `prune-ghcr.yml` workflow handles any remaining cleanup.
