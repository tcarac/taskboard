class Taskboard < Formula
  desc 'Local project management with Kanban UI and MCP server for AI assistants'
  homepage 'https://github.com/tcarac/taskboard'
  version '0.3.0'
  license 'MIT'

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/tcarac/taskboard/releases/download/v#{version}/taskboard-darwin-arm64.tar.gz"
      sha256 '0983bc77d63403643059295dd7d20cd22bd8a432a08c4149d82e9d9028b4af22'
    elsif Hardware::CPU.intel?
      url "https://github.com/tcarac/taskboard/releases/download/v#{version}/taskboard-darwin-amd64.tar.gz"
      sha256 'e4c858bc202ed6b3e16e8445f0472302028b5bbbfcfb4a6764f537ed29c71d9c'
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/tcarac/taskboard/releases/download/v#{version}/taskboard-linux-arm64.tar.gz"
      sha256 '8d15bc8fb9322aed8ca4f3915761f836f09632a28af929493bd438e13b504056'
    elsif Hardware::CPU.intel?
      url "https://github.com/tcarac/taskboard/releases/download/v#{version}/taskboard-linux-amd64.tar.gz"
      sha256 '079aa9e5f64ac74ac4e344b05d27a383aa6b759980013b3f8d00681f94281e12'
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
