class Taskboard < Formula
  desc 'Local project management with Kanban UI and MCP server for AI assistants'
  homepage 'https://github.com/tcarac/taskboard'
  version '0.1.0'
  license 'MIT'

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/tcarac/taskboard/releases/download/v#{version}/taskboard-darwin-arm64.tar.gz"
      sha256 'f79b23fe044ad46b410c5f1bae88862294ca8dd4cceeb9108434f9eabc4acd14'
    elsif Hardware::CPU.intel?
      url "https://github.com/tcarac/taskboard/releases/download/v#{version}/taskboard-darwin-amd64.tar.gz"
      sha256 'a043cc06d3750a3bd6eeecd95fa5e7e26978fa2d46f396170270851fdde15705'
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/tcarac/taskboard/releases/download/v#{version}/taskboard-linux-arm64.tar.gz"
      sha256 'e3904fb7f7e335bce866c1585f2ab8f12270c5e5aed62ec3a058f01bb1b9846f'
    elsif Hardware::CPU.intel?
      url "https://github.com/tcarac/taskboard/releases/download/v#{version}/taskboard-linux-amd64.tar.gz"
      sha256 '60762972c76433ad9aa1843bbb9364004d3fd42f0b6ae9032f08486a1b4c18b8'
    end
  end

  def install
    if OS.mac?
      if Hardware::CPU.arm?
        bin.install 'taskboard-darwin-arm64' => 'taskboard'
      else
        bin.install 'taskboard-darwin-amd64' => 'taskboard'
      end
    elsif OS.linux?
      if Hardware::CPU.arm?
        bin.install 'taskboard-linux-arm64' => 'taskboard'
      else
        bin.install 'taskboard-linux-amd64' => 'taskboard'
      end
    end
  end

  test do
    assert_match 'taskboard', shell_output("#{bin}/taskboard --help")
  end
end
