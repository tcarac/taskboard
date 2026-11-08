//go:build windows

package cli

import "syscall"

// DETACHED_PROCESS: run the daemon without a console window.
const detachedProcess = 0x00000008

func daemonSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{CreationFlags: detachedProcess}
}
