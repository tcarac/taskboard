package main

import (
	"embed"
	"io/fs"

	"github.com/tcarac/taskboard/internal/cli"
)

//go:embed web/dist
var webEmbed embed.FS

func main() {
	webFS, err := fs.Sub(webEmbed, "web/dist")
	if err != nil {
		webFS = nil
	}
	cli.Execute(webFS)
}
