class Taskboard < Formula
  desc 'Local project management with Kanban UI and MCP server for AI assistants'
  homepage 'https://github.com/tcarac/taskboard'
  url 'https://github.com/tcarac/taskboard/releases/download/v0.1.0/taskboard-darwin-arm64.tar.gz'
  sha256 'REPLACE_WITH_ACTUAL_SHA256'
  version '0.1.0'
  license 'MIT'

  def install
    bin.install 'taskboard-darwin-arm64' => 'taskboard'
  end

  test do
    assert_match 'taskboard', shell_output("#{bin}/taskboard --help")
  end
end
