"use client";

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin" });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json.data as T;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json.data as T;
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "same-origin",
    body: form,
  });
  const json = (await res.json()) as ApiResponse<{ url: string }>;
  if (!res.ok || !json.ok) throw new Error(json.error || "Upload failed");
  if (!json.data) throw new Error("Upload failed: server returned no data");
  return json.data.url;
}
