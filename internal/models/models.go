package models

import "time"

type Project struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Prefix      string    `json:"prefix"`
	Description string    `json:"description,omitempty"`
	Icon        string    `json:"icon,omitempty"`
	Color       string    `json:"color,omitempty"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Team struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Color     string    `json:"color,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type Ticket struct {
	ID          string     `json:"id"`
	ProjectID   string     `json:"projectId"`
	TeamID      *string    `json:"teamId,omitempty"`
	Number      int        `json:"number"`
	Title       string     `json:"title"`
	Description string     `json:"description,omitempty"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	DueDate     *time.Time `json:"dueDate,omitempty"`
	Position    float64    `json:"position"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// Populated fields (not stored directly)
	ProjectPrefix string    `json:"projectPrefix,omitempty"`
	Labels        []Label   `json:"labels,omitempty"`
	Subtasks      []Subtask `json:"subtasks,omitempty"`
	BlockedBy     []string  `json:"blockedBy,omitempty"`
}

// DisplayKey returns the human-readable ticket key like "AUTH-1"
func (t Ticket) DisplayKey() string {
	if t.ProjectPrefix != "" {
		return t.ProjectPrefix + "-" + itoa(t.Number)
	}
	return itoa(t.Number)
}

func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	s := ""
	neg := false
	if i < 0 {
		neg = true
		i = -i
	}
	for i > 0 {
		s = string(rune('0'+i%10)) + s
		i /= 10
	}
	if neg {
		s = "-" + s
	}
	return s
}

type Label struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type Subtask struct {
	ID        string `json:"id"`
	TicketID  string `json:"ticketId"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
	Position  int    `json:"position"`
}

type TicketDependency struct {
	TicketID    string `json:"ticketId"`
	BlockedByID string `json:"blockedById"`
}

// Board represents the kanban board view
type Board struct {
	ProjectID string   `json:"projectId,omitempty"`
	Columns   []Column `json:"columns"`
}

type Column struct {
	Status  string   `json:"status"`
	Tickets []Ticket `json:"tickets"`
}

type CreateProjectRequest struct {
	Name        string `json:"name"`
	Prefix      string `json:"prefix"`
	Description string `json:"description,omitempty"`
	Icon        string `json:"icon,omitempty"`
	Color       string `json:"color,omitempty"`
}

type UpdateProjectRequest struct {
	Name        *string `json:"name,omitempty"`
	Prefix      *string `json:"prefix,omitempty"`
	Description *string `json:"description,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	Color       *string `json:"color,omitempty"`
	Status      *string `json:"status,omitempty"`
}

type CreateTeamRequest struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

type UpdateTeamRequest struct {
	Name  *string `json:"name,omitempty"`
	Color *string `json:"color,omitempty"`
}

type CreateTicketRequest struct {
	ProjectID   string   `json:"projectId"`
	TeamID      *string  `json:"teamId,omitempty"`
	Title       string   `json:"title"`
	Description string   `json:"description,omitempty"`
	Status      string   `json:"status,omitempty"`
	Priority    string   `json:"priority,omitempty"`
	DueDate     *string  `json:"dueDate,omitempty"`
	Labels      []string `json:"labels,omitempty"`
	BlockedBy   []string `json:"blockedBy,omitempty"`
}

type UpdateTicketRequest struct {
	TeamID      *string  `json:"teamId,omitempty"`
	Title       *string  `json:"title,omitempty"`
	Description *string  `json:"description,omitempty"`
	Status      *string  `json:"status,omitempty"`
	Priority    *string  `json:"priority,omitempty"`
	DueDate     *string  `json:"dueDate,omitempty"`
	Position    *float64 `json:"position,omitempty"`
	Labels      []string `json:"labels,omitempty"`
	BlockedBy   []string `json:"blockedBy,omitempty"`
}

type MoveTicketRequest struct {
	Status   string   `json:"status"`
	Position *float64 `json:"position,omitempty"`
}

type CreateSubtaskRequest struct {
	Title string `json:"title"`
}

type CreateLabelRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

type UpdateLabelRequest struct {
	Name  *string `json:"name,omitempty"`
	Color *string `json:"color,omitempty"`
}

type TicketFilter struct {
	ProjectID string
	TeamID    string
	Status    string
	Priority  string
}
