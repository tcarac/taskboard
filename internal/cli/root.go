package cli

import (
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

	"github.com/spf13/cobra"
	"github.com/tcarac/taskboard/internal/db"
	"github.com/tcarac/taskboard/internal/mcp"
	"github.com/tcarac/taskboard/internal/server"
)

var (
	port       int
	foreground bool
)

func NewRootCmd(webFS fs.FS) *cobra.Command {
	root := &cobra.Command{
		Use:   "taskboard",
		Short: "Local project management with Kanban UI and MCP server",
	}

	startCmd := &cobra.Command{
		Use:   "start",
		Short: "Start the web UI server",
		RunE: func(cmd *cobra.Command, args []string) error {
			if !foreground {
				return daemonize(port)
			}
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
	startCmd.Flags().BoolVar(&foreground, "foreground", false, "run in foreground instead of as a daemon")

	stopCmd := &cobra.Command{
		Use:   "stop",
		Short: "Stop the running taskboard server",
		RunE: func(cmd *cobra.Command, args []string) error {
			pidPath, err := pidFilePath()
			if err != nil {
				return err
			}

			pid, err := readPID(pidPath)
			if err != nil {
				return fmt.Errorf("taskboard is not running")
			}

			process, err := os.FindProcess(pid)
			if err != nil {
				os.Remove(pidPath)
				return fmt.Errorf("taskboard is not running")
			}

			if err := process.Signal(syscall.Signal(0)); err != nil {
				os.Remove(pidPath)
				return fmt.Errorf("taskboard is not running (stale pid file removed)")
			}

			if err := process.Signal(syscall.SIGTERM); err != nil {
				os.Remove(pidPath)
				return fmt.Errorf("failed to stop taskboard: %w", err)
			}

			os.Remove(pidPath)
			fmt.Printf("Taskboard stopped (pid %d)\n", pid)
			return nil
		},
	}

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

	root.AddCommand(startCmd, stopCmd, mcpCmd)
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

func daemonize(port int) error {
	pidPath, err := pidFilePath()
	if err != nil {
		return err
	}

	if pid, err := readPID(pidPath); err == nil {
		if p, err := os.FindProcess(pid); err == nil {
			if err := p.Signal(syscall.Signal(0)); err == nil {
				return fmt.Errorf("taskboard is already running (pid %d)", pid)
			}
		}
	}

	exe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("finding executable: %w", err)
	}

	cmd := exec.Command(exe, "start", "--port", strconv.Itoa(port), "--foreground")
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("starting daemon: %w", err)
	}

	if err := writePID(pidPath, cmd.Process.Pid); err != nil {
		return fmt.Errorf("writing pid file: %w", err)
	}

	fmt.Printf("Taskboard running at http://localhost:%d (pid %d)\n", port, cmd.Process.Pid)
	return nil
}

func pidFilePath() (string, error) {
	dataDir, err := os.UserConfigDir()
	if err != nil {
		home, err2 := os.UserHomeDir()
		if err2 != nil {
			return "", fmt.Errorf("finding home directory: %w", err)
		}
		dataDir = filepath.Join(home, ".config")
	}
	return filepath.Join(dataDir, "taskboard", "taskboard.pid"), nil
}

func writePID(path string, pid int) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(strconv.Itoa(pid)), 0o644)
}

func readPID(path string) (int, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0, err
	}
	return strconv.Atoi(strings.TrimSpace(string(data)))
}
