import { useState } from "react";
import { X, Trash2, CheckCircle2, Circle } from "lucide-react";
import { api, type Ticket, type Project, type Team, type Subtask } from "../api/client";

const STATUSES = ["todo", "in_progress", "done"];
const PRIORITIES = ["urgent", "high", "medium", "low"];

const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

export default function TicketPanel({
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
