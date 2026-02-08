import { getConfig } from "@/stores/config-store";

const BASE_URL = "/api";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const config = getConfig();
  if (config.zaiToken) headers["X-Zai-Token"] = config.zaiToken;
  if (config.githubToken) headers["X-Github-Token"] = config.githubToken;
  if (config.e2bApiKey) headers["X-E2b-Key"] = config.e2bApiKey;
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  get<T>(path: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, { headers: getHeaders() }).then((r) =>
      handleResponse<T>(r)
    );
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r));
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r));
  },

  delete<T>(path: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then((r) => handleResponse<T>(r));
  },

  stream(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
    return fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
      signal,
    });
  },
};
