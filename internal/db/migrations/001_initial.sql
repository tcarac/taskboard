CREATE TABLE IF NOT EXISTS projects (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    prefix     TEXT NOT NULL UNIQUE,
    icon       TEXT DEFAULT '',
    color      TEXT DEFAULT '#3B82F6',
    status     TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    color      TEXT DEFAULT '#6366F1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    team_id     TEXT REFERENCES teams(id) ON DELETE SET NULL,
    number      INTEGER NOT NULL,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    status      TEXT DEFAULT 'todo',
    priority    TEXT DEFAULT 'medium',
    due_date    DATETIME,
    position    REAL NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, number)
);

CREATE TABLE IF NOT EXISTS labels (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6B7280'
);

CREATE TABLE IF NOT EXISTS ticket_labels (
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    label_id  TEXT REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, label_id)
);

CREATE TABLE IF NOT EXISTS subtasks (
    id        TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    title     TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    position  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ticket_dependencies (
    ticket_id     TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    blocked_by_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, blocked_by_id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_team_id ON tickets(team_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_ticket_id ON subtasks(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_labels_ticket_id ON ticket_labels(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_dependencies_ticket_id ON ticket_dependencies(ticket_id);
