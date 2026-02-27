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
- `apps/server`: Contains the Express backend server.
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
