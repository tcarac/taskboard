# Taskboard

A local, self-hosted project management tool with a Kanban UI, full CLI, and a built-in [MCP](https://modelcontextprotocol.io/) server that lets AI assistants manage your projects, tickets, and teams directly.

Single binary. SQLite-backed. No Docker, no external database, no runtime dependencies.

## Features

- **Kanban Board** — drag-and-drop ticket management across Todo, In Progress, and Done columns
- **Projects** — organize work with customizable projects (icons, colors, prefixes)
- **Teams** — assign tickets to teams
- **Tickets** — priority levels, due dates, labels, subtasks, dependencies (blocked by)
- **CLI** — manage everything from the terminal
- **MCP Server** — 18 tools for AI-native project management via Model Context Protocol
- **Self-Hosted** — your data stays on your machine in a SQLite database
- **Single Binary** — one `brew install` and you're running

## Install

### Homebrew

```bash
brew tap tcarac/taskboard
brew install taskboard
```

### From source

```bash
git clone https://github.com/tcarac/taskboard.git
cd taskboard
make build
```

Requires Go 1.24+ and Node.js 22+.

## Usage

### Web UI

```bash
taskboard start
# => http://localhost:3010

taskboard start --port 8080
```

### CLI

```bash
taskboard project create "Auth System" --prefix AUTH --icon "🔐"
taskboard project list

taskboard ticket create --project <ID> --title "Implement login" --priority high
taskboard ticket list --project <ID> --status todo
taskboard ticket move <ID> --status done

taskboard team create "Backend"
taskboard team list
```

### MCP Server (for AI assistants)

```bash
taskboard mcp
```

#### Claude Code

```bash
claude mcp add taskboard -- /path/to/taskboard mcp
```

#### Claude Desktop

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taskboard": {
      "command": "/path/to/taskboard",
      "args": ["mcp"]
    }
  }
}
```

#### Available MCP Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects with optional status filter |
| `get_project` | Get project details by ID |
| `create_project` | Create a new project |
| `update_project` | Update project properties |
| `delete_project` | Delete a project |
| `list_teams` | List all teams |
| `get_team` | Get team details by ID |
| `create_team` | Create a new team |
| `update_team` | Update team properties |
| `delete_team` | Delete a team |
| `list_tickets` | List tickets with filters |
| `get_ticket` | Get ticket details with subtasks and labels |
| `create_ticket` | Create a new ticket |
| `update_ticket` | Update ticket properties |
| `move_ticket` | Move ticket to different status column |
| `delete_ticket` | Delete a ticket |
| `get_board` | Get full Kanban board grouped by status |
| `toggle_subtask` | Toggle subtask completion |

## Data Storage

All data is stored in a SQLite database at:

- **macOS**: `~/Library/Application Support/taskboard/taskboard.db`
- **Linux**: `~/.config/taskboard/taskboard.db`

Migrations run automatically on first start.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Go |
| Database | SQLite (via modernc.org/sqlite, pure Go) |
| CLI | cobra |
| HTTP | chi |
| Frontend | React, TypeScript, Tailwind CSS v4, dnd-kit |
| MCP | JSON-RPC over stdio |
| Distribution | Single binary with embedded frontend via `embed.FS` |

## Development

```bash
# Run backend (serves API on :3010)
go run ./cmd/taskboard start

# Run frontend dev server (proxies API to :3010)
cd web && npm run dev

# Build everything
make build

# Clean
make clean
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
