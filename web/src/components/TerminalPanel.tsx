import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { X } from "lucide-react";
import "@xterm/xterm/css/xterm.css";

export default function TerminalPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const [height, setHeight] = useState(400);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const connect = useCallback(() => {
    if (!termRef.current || xtermRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      theme: {
        background: "#0f172a",
        foreground: "#e2e8f0",
        cursor: "#60a5fa",
        selectionBackground: "#334155",
        black: "#0f172a",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#eab308",
        blue: "#3b82f6",
        magenta: "#a855f7",
        cyan: "#06b6d4",
        white: "#e2e8f0",
        brightBlack: "#475569",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#facc15",
        brightBlue: "#60a5fa",
        brightMagenta: "#c084fc",
        brightCyan: "#22d3ee",
        brightWhite: "#f8fafc",
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(termRef.current);
    fit.fit();

    xtermRef.current = term;
    fitRef.current = fit;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${proto}//${window.location.host}/api/terminal/ws`
    );
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows })
      );
    };

    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(e.data));
      }
    };

    ws.onclose = () => {
      setConnected(false);
      term.write(
        "\r\n\x1b[90m[session ended — reopen terminal to reconnect]\x1b[0m\r\n"
      );
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(new TextEncoder().encode(data));
      }
    });

    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    xtermRef.current?.dispose();
    xtermRef.current = null;
    fitRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => connect());
    } else {
      disconnect();
    }
  }, [isOpen, connect, disconnect]);

  useEffect(() => {
    const handleResize = () => fitRef.current?.fit();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fitRef.current?.fit();
  }, [height, isOpen]);

  const handleDragStart = (e: React.MouseEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = height;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startY.current - ev.clientY;
      setHeight(
        Math.max(
          200,
          Math.min(window.innerHeight - 100, startH.current + delta)
        )
      );
    };

    const onUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      fitRef.current?.fit();
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  if (!isOpen) return null;

  return (
    <div
      className="shrink-0 border-t border-slate-700 bg-slate-900 flex flex-col"
      style={{ height }}
    >
      <div
        className="h-1.5 cursor-row-resize hover:bg-blue-500/30 transition-colors"
        onMouseDown={handleDragStart}
      />

      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-slate-800">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? "bg-green-400" : "bg-slate-600"
            }`}
          />
          Terminal
        </span>
        <span className="flex-1" />
        <button
          onClick={() => onClose()}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={termRef} className="flex-1 px-1" />
    </div>
  );
}
