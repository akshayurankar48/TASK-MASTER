"use client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface FetchOptions extends RequestInit {
  token?: string | null;
}

async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers,
    ...rest,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Something went wrong");
  }

  return data;
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string }) =>
    apiClient("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiClient("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  me: (token: string) =>
    apiClient("/api/auth/me", { token }),

  // Projects
  getProjects: (token: string) =>
    apiClient("/api/projects", { token }),

  createProject: (token: string, body: { name: string; description?: string }) =>
    apiClient("/api/projects", { method: "POST", body: JSON.stringify(body), token }),

  getProject: (token: string, id: string) =>
    apiClient(`/api/projects/${id}`, { token }),

  updateProject: (token: string, id: string, body: { name?: string; description?: string }) =>
    apiClient(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(body), token }),

  deleteProject: (token: string, id: string) =>
    apiClient(`/api/projects/${id}`, { method: "DELETE", token }),

  addMember: (token: string, projectId: string, email: string) =>
    apiClient(`/api/projects/${projectId}/members`, {
      method: "POST", body: JSON.stringify({ email }), token,
    }),

  removeMember: (token: string, projectId: string, userId: string) =>
    apiClient(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE", token }),

  // Tasks
  getTasks: (token: string, projectId: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiClient(`/api/projects/${projectId}/tasks${query}`, { token });
  },

  createTask: (token: string, projectId: string, body: Record<string, unknown>) =>
    apiClient(`/api/projects/${projectId}/tasks`, {
      method: "POST", body: JSON.stringify(body), token,
    }),

  updateTask: (token: string, projectId: string, taskId: string, body: Record<string, unknown>) =>
    apiClient(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PUT", body: JSON.stringify(body), token,
    }),

  deleteTask: (token: string, projectId: string, taskId: string) =>
    apiClient(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE", token }),

  assignTask: (token: string, projectId: string, taskId: string, userIds: string[]) =>
    apiClient(`/api/projects/${projectId}/tasks/${taskId}/assign`, {
      method: "POST", body: JSON.stringify({ userIds }), token,
    }),

  unassignTask: (token: string, projectId: string, taskId: string, userIds: string[]) =>
    apiClient(`/api/projects/${projectId}/tasks/${taskId}/assign`, {
      method: "DELETE", body: JSON.stringify({ userIds }), token,
    }),

  // Comments
  getComments: (token: string, taskId: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiClient(`/api/tasks/${taskId}/comments${query}`, { token });
  },

  addComment: (token: string, taskId: string, content: string) =>
    apiClient(`/api/tasks/${taskId}/comments`, {
      method: "POST", body: JSON.stringify({ content }), token,
    }),

  // Search
  search: (token: string, projectId: string, query: string) =>
    apiClient(`/api/projects/${projectId}/search?q=${encodeURIComponent(query)}`, { token }),
};
