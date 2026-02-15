# Contributing to Taskboard

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. **Prerequisites**: Go 1.24+, Node.js 22+
2. Clone the repo:
   ```bash
   git clone https://github.com/tcarac/taskboard.git
   cd taskboard
   ```
3. Build:
   ```bash
   make build
   ```
4. For frontend development:
   ```bash
   # Terminal 1: backend
   go run ./cmd/taskboard start

   # Terminal 2: frontend dev server (hot reload, proxies API to :3010)
   cd web && npm run dev
   ```

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. If you've added functionality, update the README if applicable
3. Make sure `make build` succeeds
4. Run `go test ./...` and ensure all tests pass
5. Open a PR against `main`

## Branch Naming

Use descriptive branch names:
- `feat/kanban-swimlanes`
- `fix/ticket-drag-drop`
- `docs/mcp-setup-guide`
- `chore/update-deps`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add swimlane support to kanban board
fix: prevent duplicate ticket numbers on concurrent creation
docs: add MCP setup instructions for Cursor
chore: upgrade Go to 1.25
```

## Reporting Issues

- Use the provided issue templates (Bug Report or Feature Request)
- Include steps to reproduce for bugs
- Include your OS and `taskboard --help` output

## Code Style

- **Go**: follow standard `gofmt` formatting. No linter overrides.
- **TypeScript/React**: follow the existing patterns in `web/src/`. No `any` types.
- **SQL**: use snake_case for column names, uppercase for keywords in migrations.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
