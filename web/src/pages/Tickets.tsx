import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  ChevronRight,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Calendar,
  Ticket as TicketIcon,
  Tag as TagIcon,
} from "lucide-react";
import { api, type Ticket, type TicketInput, type Project, type Team } from "../api/client";
import TicketPanel from "../components/TicketPanel";
import CreateTicketModal from "../components/CreateTicketModal";
import { STATUSES, STATUS_LABELS, STATUS_STYLES } from "../lib/statuses";
import { allTags, groupByTag, tagNames } from "../lib/tags";

const PRIORITIES = ["urgent", "high", "medium", "low"];

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
  const [filterTag, setFilterTag] = useState("");
  const [groupByTags, setGroupByTags] = useState(false);

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
    if (filterTag && !tagNames(t).includes(filterTag)) return false;
    return true;
  });

  const groups = groupByTag(filtered);
  const tagOptions = allTags(tickets);

  const handleCreate = async (data: TicketInput) => {
    await api.tickets.create(data);
    setShowCreate(false);
    load();
  };

  const handleUpdate = async (id: string, data: TicketInput) => {
    await api.tickets.update(id, data);
    load();
  };

  const handleDelete = async (id: string) => {
    await api.tickets.delete(id);
    load();
  };

  const renderTable = (list: Ticket[]) => (
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
              {list.map((ticket) => (
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
  );

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
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded-md border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Tags</option>
          {tagOptions.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={groupByTags}
            onChange={(e) => setGroupByTags(e.target.checked)}
            className="accent-blue-500"
          />
          Group by tag
        </label>
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
          groupByTags ? groups.map((g) => (
            <section key={g.tag}>
              <h2 className="px-6 pt-5 pb-2 text-xs font-semibold text-slate-300 flex items-center gap-2">
                <TagIcon className="w-3.5 h-3.5 text-slate-500" />
                {g.tag}
                <span className="text-slate-600 font-normal">{g.tickets.length}</span>
              </h2>
              {renderTable(g.tickets)}
            </section>
          )) : renderTable(filtered)
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
