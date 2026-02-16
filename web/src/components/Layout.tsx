import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Ticket,
  Zap,
  TerminalSquare,
} from "lucide-react";
import TerminalPanel from "./TerminalPanel";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Board" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/teams", icon: Users, label: "Teams" },
  { to: "/tickets", icon: Ticket, label: "Tickets" },
];

export default function Layout() {
  const [terminalOpen, setTerminalOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-slate-800">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold tracking-wide text-white">
            Taskboard
          </span>
        </div>

        <nav className="flex-1 py-3 px-2.5 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-2.5 pb-2">
          <button
            onClick={() => setTerminalOpen((v) => !v)}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors w-full ${
              terminalOpen
                ? "bg-blue-500/15 text-blue-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <TerminalSquare className="w-4 h-4" />
            Terminal
          </button>
        </div>

        <div className="px-5 py-3 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 tracking-wider uppercase">
            v0.6.0
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-slate-950">
          <Outlet />
        </main>
        <TerminalPanel
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
        />
      </div>
    </div>
  );
}
