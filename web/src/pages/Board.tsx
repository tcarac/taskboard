import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  Calendar,
  GripVertical,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import { api, type Ticket, type Project, type BoardColumn } from "../api/client";

const STATUSES = ["todo", "in_progress", "done"];
const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};
const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-500",
  in_progress: "bg-blue-500",
  done: "bg-green-500",
};

const PRIORITY_CONFIG: Record<string, { color: string; icon: typeof ArrowUp }> = {
  urgent: { color: "text-red-500", icon: AlertTriangle },
  high: { color: "text-orange-500", icon: ArrowUp },
  medium: { color: "text-yellow-500", icon: ArrowRight },
  low: { color: "text-green-500", icon: ArrowDown },
};

function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${config.color}`}>
      <Icon className="w-3 h-3" />
      {priority}
    </span>
  );
}

function SubtaskProgress({ subtasks }: { subtasks: Ticket["subtasks"] }) {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter((s) => s.completed).length;
  const pct = Math.round((done / subtasks.length) * 100);
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <CheckCircle2 className="w-3 h-3" />
      <div className="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>
        {done}/{subtasks.length}
      </span>
    </div>
  );
}

function TicketCard({
  ticket,
  isDragging,
}: {
  ticket: Ticket;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-slate-700/50 bg-slate-900 p-3 space-y-2 transition-colors hover:border-slate-600 ${
        isDragging ? "opacity-90 shadow-xl shadow-blue-500/10 rotate-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-mono text-slate-500">
          {ticket.projectPrefix}-{ticket.number}
        </span>
        <PriorityBadge priority={ticket.priority} />
      </div>
      <p className="text-sm text-slate-200 leading-snug">{ticket.title}</p>
      {ticket.dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          {new Date(ticket.dueDate).toLocaleDateString()}
        </div>
      )}
      <SubtaskProgress subtasks={ticket.subtasks} />
    </div>
  );
}

function DraggableTicket({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
  });

  return (
    <div
      ref={setNodeRef}
      className={`group relative ${isDragging ? "opacity-30" : ""}`}
    >
      <div
        {...listeners}
        {...attributes}
        className="absolute -left-1 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3.5 h-3.5 text-slate-600" />
      </div>
      <TicketCard ticket={ticket} />
    </div>
  );
}

function Column({
  status,
  tickets,
}: {
  status: string;
  tickets: Ticket[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-80 shrink-0">
      <div className="flex items-center gap-2 px-1 pb-3">
        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
        <h3 className="text-sm font-medium text-slate-300">
          {STATUS_LABELS[status]}
        </h3>
        <span className="text-xs text-slate-600 ml-auto">{tickets.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 rounded-lg p-2 transition-colors min-h-32 ${
          isOver ? "bg-blue-500/5 ring-1 ring-blue-500/20" : ""
        }`}
      >
        {tickets.map((ticket) => (
          <DraggableTicket key={ticket.id} ticket={ticket} />
        ))}
        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-slate-700 border border-dashed border-slate-800 rounded-lg">
            Drop tickets here
          </div>
        )}
      </div>
    </div>
  );
}

export default function Board() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadBoard = useCallback(async () => {
    try {
      const board = await api.board.get(selectedProject || undefined);
      setColumns(board.columns || []);
    } catch {
      setColumns(
        STATUSES.map((status) => ({ status, tickets: [] }))
      );
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    api.projects.list().then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    loadBoard();
  }, [loadBoard]);

  const getColumnTickets = (status: string) =>
    columns.find((c) => c.status === status)?.tickets || [];

  const findTicketById = (id: UniqueIdentifier): Ticket | undefined => {
    for (const col of columns) {
      const found = col.tickets.find((t) => t.id === id);
      if (found) return found;
    }
    return undefined;
  };

  const findColumnByTicketId = (id: UniqueIdentifier): string | undefined => {
    for (const col of columns) {
      if (col.tickets.find((t) => t.id === id)) return col.status;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = findTicketById(event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeStatus = findColumnByTicketId(active.id);
    const overStatus = STATUSES.includes(over.id as string)
      ? (over.id as string)
      : findColumnByTicketId(over.id);

    if (!activeStatus || !overStatus || activeStatus === overStatus) return;

    setColumns((prev) =>
      prev.map((col) => {
        if (col.status === activeStatus) {
          return { ...col, tickets: col.tickets.filter((t) => t.id !== active.id) };
        }
        if (col.status === overStatus) {
          const ticket = findTicketById(active.id);
          if (!ticket) return col;
          return { ...col, tickets: [...col.tickets, { ...ticket, status: overStatus }] };
        }
        return col;
      })
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const targetStatus = STATUSES.includes(over.id as string)
      ? (over.id as string)
      : findColumnByTicketId(over.id);

    if (!targetStatus) return;

    try {
      await api.tickets.move(active.id as string, targetStatus);
    } catch {
      loadBoard();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-white">Board</h1>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-slate-800 text-sm text-slate-300 rounded-md border border-slate-700 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>
      </header>

      <div className="flex-1 overflow-x-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-600">
            Loading board…
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 h-full">
              {STATUSES.map((status) => (
                <Column
                  key={status}
                  status={status}
                  tickets={getColumnTickets(status)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTicket ? (
                <div className="w-80">
                  <TicketCard ticket={activeTicket} isDragging />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
