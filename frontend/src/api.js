const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch (_) {
      /* sem corpo JSON */
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  list: (resource) => request(`/${resource}`),
  create: (resource, data) =>
    request(`/${resource}`, { method: "POST", body: JSON.stringify(data) }),
  update: (resource, id, data) =>
    request(`/${resource}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (resource, id) =>
    request(`/${resource}/${id}`, { method: "DELETE" }),
};
