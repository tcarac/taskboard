package cli

import (
	"fmt"
	"io/fs"
	"os"

	"github.com/spf13/cobra"
	"github.com/tcarac/taskboard/internal/db"
	"github.com/tcarac/taskboard/internal/mcp"
	"github.com/tcarac/taskboard/internal/server"
)

var port int

func NewRootCmd(webFS fs.FS) *cobra.Command {
	root := &cobra.Command{
		Use:   "taskboard",
		Short: "Local project management with Kanban UI and MCP server",
	}

	startCmd := &cobra.Command{
		Use:   "start",
		Short: "Start the web UI server",
		RunE: func(cmd *cobra.Command, args []string) error {
			database, err := db.Open()
			if err != nil {
				return fmt.Errorf("opening database: %w", err)
			}
			store := db.NewStore(database)
			srv := server.New(store, webFS)
			return srv.ListenAndServe(port)
		},
	}
	startCmd.Flags().IntVarP(&port, "port", "p", 3010, "port to listen on")

	mcpCmd := &cobra.Command{
		Use:   "mcp",
		Short: "Start MCP stdio server for AI assistants",
		RunE: func(cmd *cobra.Command, args []string) error {
			database, err := db.Open()
			if err != nil {
				return fmt.Errorf("opening database: %w", err)
			}
			store := db.NewStore(database)
			srv := mcp.NewServer(store)
			return srv.Run()
		},
	}

	root.AddCommand(startCmd, mcpCmd)
	root.AddCommand(projectCommands())
	root.AddCommand(teamCommands())
	root.AddCommand(ticketCommands())

	return root
}

func Execute(webFS fs.FS) {
	if err := NewRootCmd(webFS).Execute(); err != nil {
		os.Exit(1)
	}
}

func openStore() (*db.Store, error) {
	database, err := db.Open()
	if err != nil {
		return nil, err
	}
	return db.NewStore(database), nil
}
