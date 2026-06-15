// src/utilities/api.js
const API_BASE_URL = 'http://127.0.0.1:8001/api/v1';

export function getToken() {
  return localStorage.getItem('comiccache_token');
}

export function setToken(token) {
  localStorage.setItem('comiccache_token', token);
}

export function clearToken() {
  localStorage.removeItem('comiccache_token');
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.reload();
  }
  return res;
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Login failed");
  }
  return res.json();
}

export async function register(username, roleId) {
  const res = await authFetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username, role_id: roleId || 5 }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Registration failed");
  }
  return res.json();
}

export async function fetchMe() {
  const res = await authFetch(`${API_BASE_URL}/auth/me`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function fetchUsers() {
  const res = await authFetch(`${API_BASE_URL}/auth/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchBoxes() {
  const res = await fetch(`${API_BASE_URL}/boxes`);
  if (!res.ok) throw new Error("Failed to pull longbox indices.");
  return res.json();
}

export async function createBox(boxData) {
  const res = await fetch(`${API_BASE_URL}/boxes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(boxData),
  });
  if (!res.ok) throw new Error("Failed to execute new container commit.");
  return res.json();
}

export async function fetchValuation(boxId) {
  const res = await fetch(`${API_BASE_URL}/boxes/${boxId}/valuation`);
  if (!res.ok) throw new Error("Failed to process balance metrics.");
  return res.json();
}

export async function postBarcodeScan(payload) {
  const response = await fetch(`${API_BASE_URL}/scan/process-barcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) throw new Error('Network payload resolution error');
  return response.json();
}

export async function searchComics(query) {
  const res = await fetch(`${API_BASE_URL}/comics/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search execution pipeline failure.");
  return res.json();
}

export async function fetchBoxComics(boxId) {
  const res = await fetch(`${API_BASE_URL}/boxes/${boxId}/comics`);
  if (!res.ok) throw new Error("Failed to load box inventory.");
  return res.json();
}

export async function fetchPicklist() {
  const res = await authFetch(`${API_BASE_URL}/picklist`);
  if (!res.ok) throw new Error("Failed to load picklist.");
  return res.json();
}

export async function addToPicklist(item) {
  const res = await authFetch(`${API_BASE_URL}/picklist`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to add to picklist.");
  return res.json();
}

export async function removeFromPicklist(id) {
  const res = await authFetch(`${API_BASE_URL}/picklist/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error("Failed to remove from picklist.");
  return res.json();
}

export async function clearPicklist() {
  const res = await authFetch(`${API_BASE_URL}/picklist`, { method: 'DELETE' });
  if (!res.ok) throw new Error("Failed to clear picklist.");
  return res.json();
}

export async function updatePicklistItem(id, data) {
  const res = await authFetch(`${API_BASE_URL}/picklist/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update picklist item.");
  return res.json();
}

export async function changePassword(currentPassword, newPassword) {
  const res = await authFetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to change password");
  }
  return res.json();
}

export async function resetPassword(userId) {
  const res = await authFetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to reset password");
  }
  return res.json();
}

export async function fetchComicDetail(comicId) {
  const res = await fetch(`${API_BASE_URL}/comics/${comicId}`);
  if (!res.ok) throw new Error('Failed to fetch comic detail');
  return res.json();
}

export async function fetchCoverForIssue(title, issue_number, publisher) {
  const res = await fetch(`${API_BASE_URL}/series/cover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, issue_number, publisher }),
  });
  if (!res.ok) throw new Error('Failed to fetch cover for issue');
  return res.json();
}

export async function fetchSeriesOverview(title, publisher) {
  const res = await fetch(`${API_BASE_URL}/series/overview?title=${encodeURIComponent(title)}&publisher=${encodeURIComponent(publisher)}`);
  if (!res.ok) throw new Error("Failed to load series historical run.");
  return res.json();
}

// --- ROLE MANAGEMENT API ---

export async function fetchRoles() {
  const res = await authFetch(`${API_BASE_URL}/auth/roles`);
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json();
}

export async function createRole(roleData) {
  const res = await authFetch(`${API_BASE_URL}/auth/roles`, {
    method: 'POST',
    body: JSON.stringify(roleData),
  });
  if (!res.ok) throw new Error("Failed to create role");
  return res.json();
}

export async function updateRole(roleId, roleData) {
  const res = await authFetch(`${API_BASE_URL}/auth/roles/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(roleData),
  });
  if (!res.ok) throw new Error("Failed to update role");
  return res.json();
}

export async function deleteRole(roleId) {
  const res = await authFetch(`${API_BASE_URL}/auth/roles/${roleId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Failed to delete role");
  return res.json();
}

export async function updateUserRole(userId, roleId) {
  const res = await authFetch(`${API_BASE_URL}/auth/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role_id: roleId }),
  });
  if (!res.ok) throw new Error("Failed to update user role");
  return res.json();
}

export async function fetchAdminStats() {
  const res = await authFetch(`${API_BASE_URL}/auth/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function updateUserPermissions(userId, overrides) {
  const res = await authFetch(`${API_BASE_URL}/auth/users/${userId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ overrides }),
  });
  if (!res.ok) throw new Error("Failed to update user permissions");
  return res.json();
}

// --- REGISTER WITH ROLE ---

export async function registerWithRole(username, roleId) {
  const res = await authFetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username, role_id: roleId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Registration failed");
  }
  return res.json();
}
