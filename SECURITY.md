# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email **tomascaraccia@gmail.com** with details
3. Include steps to reproduce if possible
4. You'll receive an acknowledgement within 48 hours

## Scope

Taskboard runs locally and stores data in a local SQLite database. The primary attack surface is:

- The HTTP server when running `taskboard start` (binds to localhost by default)
- The MCP stdio server when running `taskboard mcp`

## Best Practices

- Taskboard binds to `localhost` only — it is not designed to be exposed to the internet
- The SQLite database is stored in your user config directory with standard file permissions
- No authentication is implemented since this is a local-only tool
