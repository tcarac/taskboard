export interface Project {
  id: string;
  name: string;
  prefix: string;
  description: string;
  icon: string;
  color: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  ticketId: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface Ticket {
  id: string;
  projectId: string;
  teamId?: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  projectPrefix: string;
  labels: Label[];
  subtasks: Subtask[];
  blockedBy: string[];
}

export interface BoardColumn {
  status: string;
  tickets: Ticket[];
}

export interface Board {
  projectId: string;
  columns: BoardColumn[];
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  projects: {
    list: () => request<Project[]>("/api/projects"),
    get: (id: string) => request<Project>(`/api/projects/${id}`),
    create: (data: Partial<Project>) =>
      request<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Project>) =>
      request<Project>(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  },

  teams: {
    list: () => request<Team[]>("/api/teams"),
    get: (id: string) => request<Team>(`/api/teams/${id}`),
    create: (data: Partial<Team>) =>
      request<Team>("/api/teams", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Team>) =>
      request<Team>(`/api/teams/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/teams/${id}`, { method: "DELETE" }),
  },

  tickets: {
    list: () => request<Ticket[]>("/api/tickets"),
    get: (id: string) => request<Ticket>(`/api/tickets/${id}`),
    create: (data: Partial<Ticket>) =>
      request<Ticket>("/api/tickets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Ticket>) =>
      request<Ticket>(`/api/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/tickets/${id}`, { method: "DELETE" }),
    move: (id: string, status: string, position?: number) =>
      request<Ticket>(`/api/tickets/${id}/move`, {
        method: "POST",
        body: JSON.stringify({ status, position }),
      }),
    addSubtask: (id: string, title: string) =>
      request<Subtask>(`/api/tickets/${id}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
  },

  subtasks: {
    toggle: (id: string) =>
      request<Subtask>(`/api/subtasks/${id}/toggle`, { method: "POST" }),
    delete: (id: string) =>
      request<void>(`/api/subtasks/${id}`, { method: "DELETE" }),
  },

  labels: {
    list: () => request<Label[]>("/api/labels"),
    create: (data: Partial<Label>) =>
      request<Label>("/api/labels", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Label>) =>
      request<Label>(`/api/labels/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/labels/${id}`, { method: "DELETE" }),
  },

  board: {
    get: (projectId?: string) =>
      request<Board>(`/api/board${projectId ? `?projectId=${projectId}` : ""}`),
  },
};
