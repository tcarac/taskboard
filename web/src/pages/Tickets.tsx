import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  X,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Calendar,
  Ticket as TicketIcon,
} from "lucide-react";
import { api, type Ticket, type Project, type Team, type Subtask } from "../api/client";

const STATUSES = ["todo", "in_progress", "done"];
const PRIORITIES = ["urgent", "high", "medium", "low"];

const STATUS_STYLES: Record<string, string> = {
  todo: "bg-slate-500/20 text-slate-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  done: "bg-green-500/20 text-green-400",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_CONFIG: Record<string, { style: string; icon: typeof ArrowUp }> = {
  urgent: { style: "bg-red-500/20 text-red-400", icon: AlertTriangle },
  high: { style: "bg-orange-500/20 text-orange-400", icon: ArrowUp },
  medium: { style: "bg-yellow-500/20 text-yellow-400", icon: ArrowRight },
  low: { style: "bg-green-500/20 text-green-400", icon: ArrowDown },
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
        STATUS_STYLES[status] || "bg-slate-700 text-slate-300"
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${config.style}`}
    >
      <Icon className="w-3 h-3" />
      {priority}
    </span>
  );
}

function CreateTicketModal({
  projects,
  teams,
  onClose,
  onCreate,
}: {
  projects: Project[];
  teams: Team[];
  onClose: () => void;
  onCreate: (data: Partial<Ticket>) => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [teamId, setTeamId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    onCreate({
      projectId,
      title,
      description,
      priority,
      status: "todo",
      dueDate: dueDate || undefined,
      teamId: teamId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New Ticket</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add more detail…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Team
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">None</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Create Ticket
          </button>
        </div>
      </form>
    </div>
  );
}

function TicketPanel({
  ticket,
  projects,
  teams,
  onClose,
  onUpdate,
  onDelete,
}: {
  ticket: Ticket;
  projects: Project[];
  teams: Team[];
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Ticket>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [dueDate, setDueDate] = useState(ticket.dueDate || "");
  const [teamId, setTeamId] = useState(ticket.teamId || "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(ticket.subtasks || []);
  const [newSubtask, setNewSubtask] = useState("");
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    onUpdate(ticket.id, {
      title,
      description,
      status,
      priority,
      dueDate: dueDate || undefined,
      teamId: teamId || undefined,
    });
    setDirty(false);
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const sub = await api.tickets.addSubtask(ticket.id, newSubtask);
    setSubtasks((prev) => [...prev, sub]);
    setNewSubtask("");
  };

  const handleToggleSubtask = async (id: string) => {
    const updated = await api.subtasks.toggle(id);
    setSubtasks((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const handleDeleteSubtask = async (id: string) => {
    await api.subtasks.delete(id);
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-700 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">
            {ticket.projectPrefix}-{ticket.number}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDelete(ticket.id);
                onClose();
              }}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            className="w-full bg-transparent text-lg font-semibold text-white focus:outline-none"
          />

          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
            rows={4}
            placeholder="Add a description…"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  markDirty();
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  markDirty();
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  markDirty();
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Team
              </label>
              <select
                value={teamId}
                onChange={(e) => {
                  setTeamId(e.target.value);
                  markDirty();
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">None</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Project
              </label>
              <div className="text-sm text-slate-400 px-3 py-2">
                {projects.find((p) => p.id === ticket.projectId)?.name || "—"}
              </div>
            </div>
          </div>

          {dirty && (
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
          )}

          <div>
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Subtasks
            </h4>
            <div className="space-y-1.5">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2.5 group px-2 py-1.5 rounded-md hover:bg-slate-800/50"
                >
                  <button
                    onClick={() => handleToggleSubtask(sub.id)}
                    className="shrink-0"
                  >
                    {sub.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      sub.completed
                        ? "text-slate-600 line-through"
                        : "text-slate-300"
                    }`}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddSubtask} className="mt-2 flex gap-2">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask…"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const load = useCallback(async () => {
    try {
      const [t, p, tm] = await Promise.all([
        api.tickets.list(),
        api.projects.list(),
        api.teams.list(),
      ]);
      setTickets(t || []);
      setProjects(p || []);
      setTeams(tm || []);
    } catch {
      setTickets([]);
      setProjects([]);
      setTeams([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = tickets.filter((t) => {
    if (filterProject && t.projectId !== filterProject) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const handleCreate = async (data: Partial<Ticket>) => {
    await api.tickets.create(data);
    setShowCreate(false);
    load();
  };

  const handleUpdate = async (id: string, data: Partial<Ticket>) => {
    await api.tickets.update(id, data);
    load();
  };

  const handleDelete = async (id: string) => {
    await api.tickets.delete(id);
    load();
  };

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-white">Tickets</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </header>

      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-slate-800/50">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded-md border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded-md border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded-md border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p} className="capitalize">
              {p}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-600 ml-auto">
          {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-600">
            Loading tickets…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600 space-y-3">
            <TicketIcon className="w-10 h-10 text-slate-700" />
            <p className="text-sm">No tickets found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-medium">Key</th>
                <th className="text-left px-6 py-3 font-medium">Title</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Priority</th>
                <th className="text-left px-6 py-3 font-medium">Due</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="border-b border-slate-800/50 hover:bg-slate-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3">
                    <span className="text-xs font-mono text-slate-500">
                      {ticket.projectPrefix}-{ticket.number}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-sm text-slate-200">
                      {ticket.title}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-6 py-3">
                    {ticket.dueDate ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(ticket.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-700">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateTicketModal
          projects={projects}
          teams={teams}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {selectedTicket && (
        <TicketPanel
          ticket={selectedTicket}
          projects={projects}
          teams={teams}
          onClose={() => {
            setSelectedTicket(null);
            load();
          }}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
