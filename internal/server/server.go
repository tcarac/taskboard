package server

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/gorilla/websocket"
	"github.com/tcarac/taskboard/internal/db"
	"github.com/tcarac/taskboard/internal/models"
)

type Server struct {
	store  *db.Store
	router chi.Router
}

func New(store *db.Store, webFS fs.FS) *Server {
	s := &Server{store: store}
	s.setupRoutes(webFS)
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
}

func (s *Server) ListenAndServe(port int) error {
	addr := fmt.Sprintf(":%d", port)
	fmt.Printf("Taskboard running at http://localhost:%d\n", port)
	return http.ListenAndServe(addr, s.router)
}

func (s *Server) setupRoutes(webFS fs.FS) {
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Route("/projects", func(r chi.Router) {
			r.Get("/", s.listProjects)
			r.Post("/", s.createProject)
			r.Get("/{id}", s.getProject)
			r.Put("/{id}", s.updateProject)
			r.Delete("/{id}", s.deleteProject)
		})

		r.Route("/teams", func(r chi.Router) {
			r.Get("/", s.listTeams)
			r.Post("/", s.createTeam)
			r.Get("/{id}", s.getTeam)
			r.Put("/{id}", s.updateTeam)
			r.Delete("/{id}", s.deleteTeam)
		})

		r.Route("/tickets", func(r chi.Router) {
			r.Get("/", s.listTickets)
			r.Post("/", s.createTicket)
			r.Get("/{id}", s.getTicket)
			r.Put("/{id}", s.updateTicket)
			r.Post("/{id}/move", s.moveTicket)
			r.Delete("/{id}", s.deleteTicket)
			r.Post("/{id}/subtasks", s.addSubtask)
		})

		r.Route("/subtasks", func(r chi.Router) {
			r.Post("/{id}/toggle", s.toggleSubtask)
			r.Delete("/{id}", s.deleteSubtask)
		})

		r.Route("/labels", func(r chi.Router) {
			r.Get("/", s.listLabels)
			r.Post("/", s.createLabel)
			r.Put("/{id}", s.updateLabel)
			r.Delete("/{id}", s.deleteLabel)
		})

		r.Get("/board", s.getBoard)
		r.Get("/terminal/ws", s.handleTerminalWS)
	})

	if webFS != nil {
		fileServer := http.FileServer(http.FS(webFS))
		r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
			if _, err := fs.Stat(webFS, r.URL.Path[1:]); err != nil {
				r.URL.Path = "/"
			}
			fileServer.ServeHTTP(w, r)
		})
	}

	s.router = r
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func decodeJSON(r *http.Request, v any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

func (s *Server) listProjects(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	projects, err := s.store.ListProjects(status)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if projects == nil {
		projects = []models.Project{}
	}
	writeJSON(w, http.StatusOK, projects)
}

func (s *Server) getProject(w http.ResponseWriter, r *http.Request) {
	p, err := s.store.GetProject(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if p == nil {
		writeError(w, http.StatusNotFound, "project not found")
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (s *Server) createProject(w http.ResponseWriter, r *http.Request) {
	var req models.CreateProjectRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.Name == "" || req.Prefix == "" {
		writeError(w, http.StatusBadRequest, "name and prefix are required")
		return
	}
	p, err := s.store.CreateProject(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (s *Server) updateProject(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateProjectRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	p, err := s.store.UpdateProject(chi.URLParam(r, "id"), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if p == nil {
		writeError(w, http.StatusNotFound, "project not found")
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (s *Server) deleteProject(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteProject(chi.URLParam(r, "id")); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) listTeams(w http.ResponseWriter, r *http.Request) {
	teams, err := s.store.ListTeams()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if teams == nil {
		teams = []models.Team{}
	}
	writeJSON(w, http.StatusOK, teams)
}

func (s *Server) getTeam(w http.ResponseWriter, r *http.Request) {
	t, err := s.store.GetTeam(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if t == nil {
		writeError(w, http.StatusNotFound, "team not found")
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (s *Server) createTeam(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTeamRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	t, err := s.store.CreateTeam(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func (s *Server) updateTeam(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateTeamRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	t, err := s.store.UpdateTeam(chi.URLParam(r, "id"), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if t == nil {
		writeError(w, http.StatusNotFound, "team not found")
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (s *Server) deleteTeam(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteTeam(chi.URLParam(r, "id")); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) listTickets(w http.ResponseWriter, r *http.Request) {
	filter := models.TicketFilter{
		ProjectID: r.URL.Query().Get("projectId"),
		TeamID:    r.URL.Query().Get("teamId"),
		Status:    r.URL.Query().Get("status"),
		Priority:  r.URL.Query().Get("priority"),
	}
	tickets, err := s.store.ListTickets(filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if tickets == nil {
		tickets = []models.Ticket{}
	}
	writeJSON(w, http.StatusOK, tickets)
}

func (s *Server) getTicket(w http.ResponseWriter, r *http.Request) {
	t, err := s.store.GetTicket(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if t == nil {
		writeError(w, http.StatusNotFound, "ticket not found")
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (s *Server) createTicket(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTicketRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.ProjectID == "" || req.Title == "" {
		writeError(w, http.StatusBadRequest, "projectId and title are required")
		return
	}
	t, err := s.store.CreateTicket(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func (s *Server) updateTicket(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateTicketRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	t, err := s.store.UpdateTicket(chi.URLParam(r, "id"), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if t == nil {
		writeError(w, http.StatusNotFound, "ticket not found")
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (s *Server) moveTicket(w http.ResponseWriter, r *http.Request) {
	var req models.MoveTicketRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.Status == "" {
		writeError(w, http.StatusBadRequest, "status is required")
		return
	}
	t, err := s.store.MoveTicket(chi.URLParam(r, "id"), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if t == nil {
		writeError(w, http.StatusNotFound, "ticket not found")
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (s *Server) deleteTicket(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteTicket(chi.URLParam(r, "id")); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) addSubtask(w http.ResponseWriter, r *http.Request) {
	var req models.CreateSubtaskRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}
	st, err := s.store.AddSubtask(chi.URLParam(r, "id"), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, st)
}

func (s *Server) toggleSubtask(w http.ResponseWriter, r *http.Request) {
	st, err := s.store.ToggleSubtask(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, st)
}

func (s *Server) deleteSubtask(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteSubtask(chi.URLParam(r, "id")); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) listLabels(w http.ResponseWriter, r *http.Request) {
	labels, err := s.store.ListLabels()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if labels == nil {
		labels = []models.Label{}
	}
	writeJSON(w, http.StatusOK, labels)
}

func (s *Server) createLabel(w http.ResponseWriter, r *http.Request) {
	var req models.CreateLabelRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.Name == "" || req.Color == "" {
		writeError(w, http.StatusBadRequest, "name and color are required")
		return
	}
	l, err := s.store.CreateLabel(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, l)
}

func (s *Server) updateLabel(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateLabelRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	l, err := s.store.UpdateLabel(chi.URLParam(r, "id"), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if l == nil {
		writeError(w, http.StatusNotFound, "label not found")
		return
	}
	writeJSON(w, http.StatusOK, l)
}

func (s *Server) deleteLabel(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteLabel(chi.URLParam(r, "id")); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) getBoard(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("projectId")
	board, err := s.store.GetBoard(projectID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, board)
}

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (s *Server) handleTerminalWS(w http.ResponseWriter, r *http.Request) {
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	shell := os.Getenv("SHELL")
	if shell == "" {
		shell = "/bin/sh"
	}
	cmd := exec.Command(shell)
	cmd.Env = append(os.Environ(), "TERM=xterm-256color")

	ptmx, err := pty.Start(cmd)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"failed to start terminal"}`))
		return
	}
	defer ptmx.Close()

	var once sync.Once
	cleanup := func() {
		once.Do(func() {
			cmd.Process.Kill()
			cmd.Wait()
		})
	}
	defer cleanup()

	// PTY → WebSocket
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := ptmx.Read(buf)
			if err != nil {
				conn.Close()
				return
			}
			if err := conn.WriteMessage(websocket.BinaryMessage, buf[:n]); err != nil {
				return
			}
		}
	}()

	// WebSocket → PTY
	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			cleanup()
			return
		}

		switch msgType {
		case websocket.BinaryMessage:
			ptmx.Write(msg)
		case websocket.TextMessage:
			var ctrl struct {
				Type string `json:"type"`
				Cols uint16 `json:"cols"`
				Rows uint16 `json:"rows"`
			}
			if json.Unmarshal(msg, &ctrl) == nil && ctrl.Type == "resize" {
				pty.Setsize(ptmx, &pty.Winsize{Cols: ctrl.Cols, Rows: ctrl.Rows})
			}
		}
	}
}
