package mcp

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/tcarac/taskboard/internal/db"
	"github.com/tcarac/taskboard/internal/models"
)

type MCPServer struct {
	store *db.Store
}

func NewServer(store *db.Store) *MCPServer {
	return &MCPServer{store: store}
}

type jsonrpcRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      any             `json:"id,omitempty"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type jsonrpcResponse struct {
	JSONRPC string    `json:"jsonrpc"`
	ID      any       `json:"id,omitempty"`
	Result  any       `json:"result,omitempty"`
	Error   *rpcError `json:"error,omitempty"`
}

type rpcError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type toolDef struct {
	Name        string     `json:"name"`
	Description string     `json:"description"`
	InputSchema jsonSchema `json:"inputSchema"`
}

type jsonSchema struct {
	Type       string                `json:"type"`
	Properties map[string]schemaProp `json:"properties,omitempty"`
	Required   []string              `json:"required,omitempty"`
}

type schemaProp struct {
	Type        string      `json:"type"`
	Description string      `json:"description"`
	Enum        []string    `json:"enum,omitempty"`
	Items       *jsonSchema `json:"items,omitempty"`
}

type textContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

func (s *MCPServer) Run() error {
	reader := bufio.NewReader(os.Stdin)
	writer := os.Stdout

	for {
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return fmt.Errorf("reading stdin: %w", err)
		}

		var req jsonrpcRequest
		if err := json.Unmarshal(line, &req); err != nil {
			continue
		}

		resp := s.handleRequest(req)
		if resp == nil {
			continue
		}

		data, err := json.Marshal(resp)
		if err != nil {
			continue
		}
		data = append(data, '\n')
		writer.Write(data)
	}
}

func (s *MCPServer) handleRequest(req jsonrpcRequest) *jsonrpcResponse {
	switch req.Method {
	case "initialize":
		return &jsonrpcResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result: map[string]any{
				"protocolVersion": "2024-11-05",
				"capabilities": map[string]any{
					"tools": map[string]any{},
				},
				"serverInfo": map[string]any{
					"name":    "taskboard",
					"version": "0.6.0",
				},
			},
		}

	case "notifications/initialized":
		return nil

	case "tools/list":
		return &jsonrpcResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result: map[string]any{
				"tools": s.toolDefinitions(),
			},
		}

	case "tools/call":
		return s.handleToolCall(req)

	default:
		return &jsonrpcResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &rpcError{Code: -32601, Message: "method not found: " + req.Method},
		}
	}
}

func (s *MCPServer) handleToolCall(req jsonrpcRequest) *jsonrpcResponse {
	var params struct {
		Name      string          `json:"name"`
		Arguments json.RawMessage `json:"arguments"`
	}
	if err := json.Unmarshal(req.Params, &params); err != nil {
		return &jsonrpcResponse{JSONRPC: "2.0", ID: req.ID, Error: &rpcError{Code: -32602, Message: "invalid params"}}
	}

	result, err := s.callTool(params.Name, params.Arguments)
	if err != nil {
		return &jsonrpcResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result: map[string]any{
				"content": []textContent{{Type: "text", Text: fmt.Sprintf("Error: %s", err.Error())}},
				"isError": true,
			},
		}
	}

	data, _ := json.MarshalIndent(result, "", "  ")
	return &jsonrpcResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result: map[string]any{
			"content": []textContent{{Type: "text", Text: string(data)}},
		},
	}
}

func (s *MCPServer) callTool(name string, args json.RawMessage) (any, error) {
	switch name {
	case "list_projects":
		var a struct {
			Status string `json:"status"`
		}
		json.Unmarshal(args, &a)
		return s.store.ListProjects(a.Status)

	case "get_project":
		var a struct {
			ID string `json:"id"`
		}
		json.Unmarshal(args, &a)
		p, err := s.store.GetProject(a.ID)
		if p == nil && err == nil {
			return nil, fmt.Errorf("project not found")
		}
		return p, err

	case "create_project":
		var a models.CreateProjectRequest
		json.Unmarshal(args, &a)
		return s.store.CreateProject(a)

	case "update_project":
		var a struct {
			ID string `json:"id"`
			models.UpdateProjectRequest
		}
		json.Unmarshal(args, &a)
		return s.store.UpdateProject(a.ID, a.UpdateProjectRequest)

	case "delete_project":
		var a struct {
			ID string `json:"id"`
		}
		json.Unmarshal(args, &a)
		return map[string]bool{"deleted": true}, s.store.DeleteProject(a.ID)

	case "list_teams":
		return s.store.ListTeams()

	case "get_team":
		var a struct {
			ID string `json:"id"`
		}
		json.Unmarshal(args, &a)
		t, err := s.store.GetTeam(a.ID)
		if t == nil && err == nil {
			return nil, fmt.Errorf("team not found")
		}
		return t, err

	case "create_team":
		var a models.CreateTeamRequest
		json.Unmarshal(args, &a)
		return s.store.CreateTeam(a)

	case "update_team":
		var a struct {
			ID string `json:"id"`
			models.UpdateTeamRequest
		}
		json.Unmarshal(args, &a)
		return s.store.UpdateTeam(a.ID, a.UpdateTeamRequest)

	case "delete_team":
		var a struct {
			ID string `json:"id"`
		}
		json.Unmarshal(args, &a)
		return map[string]bool{"deleted": true}, s.store.DeleteTeam(a.ID)

	case "list_tickets":
		var a models.TicketFilter
		json.Unmarshal(args, &a)
		return s.store.ListTickets(a)

	case "get_ticket":
		var a struct {
			ID string `json:"id"`
		}
		json.Unmarshal(args, &a)
		t, err := s.store.GetTicket(a.ID)
		if t == nil && err == nil {
			return nil, fmt.Errorf("ticket not found")
		}
		return t, err

	case "create_ticket":
		var a models.CreateTicketRequest
		json.Unmarshal(args, &a)
		return s.store.CreateTicket(a)

	case "update_ticket":
		var a struct {
			ID string `json:"id"`
			models.UpdateTicketRequest
		}
		json.Unmarshal(args, &a)
		return s.store.UpdateTicket(a.ID, a.UpdateTicketRequest)

	case "move_ticket":
		var a struct {
			ID string `json:"id"`
			models.MoveTicketRequest
		}
		json.Unmarshal(args, &a)
		return s.store.MoveTicket(a.ID, a.MoveTicketRequest)

	case "delete_ticket":
		var a struct {
			ID string `json:"id"`
		}
		json.Unmarshal(args, &a)
		return map[string]bool{"deleted": true}, s.store.DeleteTicket(a.ID)

	case "get_board":
		var a struct {
			ProjectID string `json:"projectId"`
		}
		json.Unmarshal(args, &a)
		return s.store.GetBoard(a.ProjectID)

	case "create_subtask":
		var a struct {
			TicketID string `json:"ticketId"`
			Title    string `json:"title"`
		}
		json.Unmarshal(args, &a)
		if a.TicketID == "" || a.Title == "" {
			return nil, fmt.Errorf("ticketId and title are required")
		}
		return s.store.AddSubtask(a.TicketID, models.CreateSubtaskRequest{Title: a.Title})

	case "batch_create_subtasks":
		var a struct {
			TicketID string `json:"ticketId"`
			Subtasks []struct {
				Title string `json:"title"`
			} `json:"subtasks"`
		}
		json.Unmarshal(args, &a)
		if a.TicketID == "" || len(a.Subtasks) == 0 {
			return nil, fmt.Errorf("ticketId and at least one subtask are required")
		}
		var created []models.Subtask
		for _, sub := range a.Subtasks {
			st, err := s.store.AddSubtask(a.TicketID, models.CreateSubtaskRequest{Title: sub.Title})
			if err != nil {
				return nil, fmt.Errorf("creating subtask %q: %w", sub.Title, err)
			}
			created = append(created, *st)
		}
		return created, nil

	case "delete_subtask":
		var a struct {
			ID string `json:"id"`
		}
		json.Unmarshal(args, &a)
		return map[string]bool{"deleted": true}, s.store.DeleteSubtask(a.ID)

	case "toggle_subtask":
		var a struct {
			ID string `json:"id"`
		}
		json.Unmarshal(args, &a)
		return s.store.ToggleSubtask(a.ID)

	default:
		return nil, fmt.Errorf("unknown tool: %s", name)
	}
}

func (s *MCPServer) toolDefinitions() []toolDef {
	return []toolDef{
		// --- Projects (top-level grouping) ---
		{
			Name:        "list_projects",
			Description: "List all projects with optional status filter. Projects are the top-level grouping — use them like epics or initiatives to organize related work.",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"status": {Type: "string", Description: "Filter by status", Enum: []string{"active", "archived"}},
				},
			},
		},
		{
			Name:        "get_project",
			Description: "Get detailed project information by ID",
			InputSchema: jsonSchema{
				Type:       "object",
				Properties: map[string]schemaProp{"id": {Type: "string", Description: "Project ID"}},
				Required:   []string{"id"},
			},
		},
		{
			Name: "create_project",
			Description: "Create a new project. Projects are the top-level organizational unit (like epics/initiatives). " +
				"Create a new project for each distinct body of work instead of creating umbrella tickets. " +
				"Hierarchy: Project → Ticket → Subtask. Never create 'epic' or 'umbrella' tickets — use a project for that. " +
				"Use the description field to capture the project's goals, scope, and any high-level context.",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"name":        {Type: "string", Description: "Project name"},
					"prefix":      {Type: "string", Description: "Short prefix for ticket keys (e.g. AUTH)"},
					"description": {Type: "string", Description: "Project description — goals, scope, context, and any high-level details about this body of work"},
					"icon":        {Type: "string", Description: "Emoji icon"},
					"color":       {Type: "string", Description: "Hex color code"},
				},
				Required: []string{"name", "prefix"},
			},
		},
		{
			Name:        "update_project",
			Description: "Update project properties",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"id":          {Type: "string", Description: "Project ID"},
					"name":        {Type: "string", Description: "Project name"},
					"prefix":      {Type: "string", Description: "Short prefix"},
					"description": {Type: "string", Description: "Project description — goals, scope, context"},
					"icon":        {Type: "string", Description: "Emoji icon"},
					"color":       {Type: "string", Description: "Hex color"},
					"status":      {Type: "string", Description: "Status", Enum: []string{"active", "archived"}},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "delete_project",
			Description: "Delete a project and all its tickets",
			InputSchema: jsonSchema{
				Type:       "object",
				Properties: map[string]schemaProp{"id": {Type: "string", Description: "Project ID"}},
				Required:   []string{"id"},
			},
		},
		// --- Teams ---
		{
			Name:        "list_teams",
			Description: "List all teams",
			InputSchema: jsonSchema{Type: "object"},
		},
		{
			Name:        "get_team",
			Description: "Get detailed team information by ID",
			InputSchema: jsonSchema{
				Type:       "object",
				Properties: map[string]schemaProp{"id": {Type: "string", Description: "Team ID"}},
				Required:   []string{"id"},
			},
		},
		{
			Name:        "create_team",
			Description: "Create a new team",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"name":  {Type: "string", Description: "Team name"},
					"color": {Type: "string", Description: "Hex color"},
				},
				Required: []string{"name"},
			},
		},
		{
			Name:        "update_team",
			Description: "Update team properties",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"id":    {Type: "string", Description: "Team ID"},
					"name":  {Type: "string", Description: "Team name"},
					"color": {Type: "string", Description: "Hex color"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "delete_team",
			Description: "Delete a team",
			InputSchema: jsonSchema{
				Type:       "object",
				Properties: map[string]schemaProp{"id": {Type: "string", Description: "Team ID"}},
				Required:   []string{"id"},
			},
		},
		// --- Tickets (tasks within a project) ---
		{
			Name:        "list_tickets",
			Description: "List tickets with optional filters by project, team, status, and priority",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"projectId": {Type: "string", Description: "Filter by project ID"},
					"teamId":    {Type: "string", Description: "Filter by team ID"},
					"status":    {Type: "string", Description: "Filter by status", Enum: []string{"todo", "in_progress", "done"}},
					"priority":  {Type: "string", Description: "Filter by priority", Enum: []string{"urgent", "high", "medium", "low"}},
				},
			},
		},
		{
			Name:        "get_ticket",
			Description: "Get detailed ticket information including subtasks, labels, and dependencies",
			InputSchema: jsonSchema{
				Type:       "object",
				Properties: map[string]schemaProp{"id": {Type: "string", Description: "Ticket ID"}},
				Required:   []string{"id"},
			},
		},
		{
			Name: "create_ticket",
			Description: "Create a ticket (task) within a project. Tickets are concrete, actionable units of work. " +
				"Do NOT create 'epic' or 'umbrella' tickets — use create_project for that level of grouping. " +
				"Use create_subtask or batch_create_subtasks to break tickets into steps. " +
				"Hierarchy: Project → Ticket → Subtask.",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"projectId":   {Type: "string", Description: "Project ID"},
					"title":       {Type: "string", Description: "Ticket title"},
					"description": {Type: "string", Description: "Rich text description"},
					"status":      {Type: "string", Description: "Initial status", Enum: []string{"todo", "in_progress", "done"}},
					"priority":    {Type: "string", Description: "Priority level", Enum: []string{"urgent", "high", "medium", "low"}},
					"teamId":      {Type: "string", Description: "Team ID"},
					"dueDate":     {Type: "string", Description: "Due date (YYYY-MM-DD)"},
				},
				Required: []string{"projectId", "title"},
			},
		},
		{
			Name:        "update_ticket",
			Description: "Update ticket properties",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"id":          {Type: "string", Description: "Ticket ID"},
					"title":       {Type: "string", Description: "Ticket title"},
					"description": {Type: "string", Description: "Description"},
					"status":      {Type: "string", Description: "Status", Enum: []string{"todo", "in_progress", "done"}},
					"priority":    {Type: "string", Description: "Priority", Enum: []string{"urgent", "high", "medium", "low"}},
					"teamId":      {Type: "string", Description: "Team ID"},
					"dueDate":     {Type: "string", Description: "Due date (YYYY-MM-DD)"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "move_ticket",
			Description: "Move ticket to a different status column",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"id":     {Type: "string", Description: "Ticket ID"},
					"status": {Type: "string", Description: "Target status", Enum: []string{"todo", "in_progress", "done"}},
				},
				Required: []string{"id", "status"},
			},
		},
		{
			Name:        "delete_ticket",
			Description: "Delete a ticket",
			InputSchema: jsonSchema{
				Type:       "object",
				Properties: map[string]schemaProp{"id": {Type: "string", Description: "Ticket ID"}},
				Required:   []string{"id"},
			},
		},
		// --- Board ---
		{
			Name:        "get_board",
			Description: "Get full Kanban board grouped by status columns (todo, in_progress, done)",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"projectId": {Type: "string", Description: "Filter by project ID (optional)"},
				},
			},
		},
		// --- Subtasks (steps within a ticket) ---
		{
			Name: "create_subtask",
			Description: "Create a subtask (checklist item) on a ticket. Subtasks break a ticket into verifiable steps. " +
				"Hierarchy: Project → Ticket → Subtask. Use batch_create_subtasks when adding multiple subtasks at once.",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"ticketId": {Type: "string", Description: "Parent ticket ID"},
					"title":    {Type: "string", Description: "Subtask description"},
				},
				Required: []string{"ticketId", "title"},
			},
		},
		{
			Name: "batch_create_subtasks",
			Description: "Create multiple subtasks on a ticket at once. More efficient than calling create_subtask repeatedly. " +
				"Use this when breaking a ticket into its implementation steps.",
			InputSchema: jsonSchema{
				Type: "object",
				Properties: map[string]schemaProp{
					"ticketId": {Type: "string", Description: "Parent ticket ID"},
					"subtasks": {Type: "array", Description: "Array of subtask objects, each with a 'title' field", Items: &jsonSchema{
						Type: "object",
						Properties: map[string]schemaProp{
							"title": {Type: "string", Description: "Subtask description"},
						},
						Required: []string{"title"},
					}},
				},
				Required: []string{"ticketId", "subtasks"},
			},
		},
		{
			Name:        "toggle_subtask",
			Description: "Toggle subtask completion status",
			InputSchema: jsonSchema{
				Type:       "object",
				Properties: map[string]schemaProp{"id": {Type: "string", Description: "Subtask ID"}},
				Required:   []string{"id"},
			},
		},
		{
			Name:        "delete_subtask",
			Description: "Delete a subtask from a ticket",
			InputSchema: jsonSchema{
				Type:       "object",
				Properties: map[string]schemaProp{"id": {Type: "string", Description: "Subtask ID"}},
				Required:   []string{"id"},
			},
		},
	}
}
