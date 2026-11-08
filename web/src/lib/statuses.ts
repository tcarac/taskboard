// Статусы тикетов. Порядок совпадает с models.TicketStatuses на бэкенде (internal/models/models.go).
export const STATUSES = ["todo", "in_progress", "ready_for_review", "done"];

export const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  ready_for_review: "Ready for Review",
  done: "Done",
};

export const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-500",
  in_progress: "bg-blue-500",
  ready_for_review: "bg-amber-500",
  done: "bg-green-500",
};

export const STATUS_STYLES: Record<string, string> = {
  todo: "bg-slate-500/20 text-slate-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  ready_for_review: "bg-amber-500/20 text-amber-400",
  done: "bg-green-500/20 text-green-400",
};
