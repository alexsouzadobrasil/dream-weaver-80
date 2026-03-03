const API_BASE = 'https://jerry.com.br/api/admin';

let adminSecret = localStorage.getItem('admin_secret') || '';

export function setAdminSecret(secret: string) {
  adminSecret = secret;
  localStorage.setItem('admin_secret', secret);
}

export function clearAdminSecret() {
  adminSecret = '';
  localStorage.removeItem('admin_secret');
}

export function getAdminSecret() {
  return adminSecret;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': adminSecret,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data.data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function adminLogin(secret: string) {
  setAdminSecret(secret);
  return request('/auth.php');
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export async function getDashboard() {
  return request<DashboardData>('/dashboard.php');
}

// ── Dreams ────────────────────────────────────────────────────────────────
export async function getDreams(params: Record<string, string | number> = {}) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return request<DreamsListData>(`/dreams.php${q ? '?' + q : ''}`);
}

export async function getDream(id: number) {
  return request<DreamDetailData>(`/dreams.php?id=${id}`);
}

export async function updateDream(id: number, fields: { status?: string; is_priority?: boolean }) {
  return request('/dreams.php', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...fields }),
  });
}

export async function deleteDream(id: number) {
  return request('/dreams.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

// ── Users ─────────────────────────────────────────────────────────────────
export async function getUsers(params: Record<string, string | number> = {}) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return request<UsersListData>(`/users.php${q ? '?' + q : ''}`);
}

export async function getUser(id: number) {
  return request<UserDetailData>(`/users.php?id=${id}`);
}

export async function updateUser(id: number, active: boolean) {
  return request('/users.php', {
    method: 'PATCH',
    body: JSON.stringify({ id, active }),
  });
}

// ── Donations ─────────────────────────────────────────────────────────────
export async function getDonations(params: Record<string, string | number> = {}) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return request<DonationsData>(`/donations.php${q ? '?' + q : ''}`);
}

// ── Logs ──────────────────────────────────────────────────────────────────
export async function getLogs(file: string, level = '', limit = 200) {
  return request<LogsData>(`/logs.php?file=${file}&level=${level}&limit=${limit}`);
}

export async function clearLog(file: string) {
  return request('/logs.php', { method: 'DELETE', body: JSON.stringify({ file }) });
}

// ── Storage ───────────────────────────────────────────────────────────────
export async function getStorage(type: string) {
  return request<StorageData>(`/storage.php?type=${type}`);
}

export async function deleteStorageFile(type: string, name: string) {
  return request('/storage.php', { method: 'DELETE', body: JSON.stringify({ type, name }) });
}

// ── Settings ──────────────────────────────────────────────────────────────
export async function getSettings() {
  return request<{ settings: Setting[] }>('/settings.php');
}

export async function updateSetting(key: string, value: string) {
  return request('/settings.php', { method: 'PATCH', body: JSON.stringify({ key, value }) });
}

// ── Types ─────────────────────────────────────────────────────────────────
export interface DashboardData {
  dreams: Record<string, number>;
  users: Record<string, number>;
  donations: Record<string, number | string>;
  recent_errors: LogEntry[];
  storage: Record<string, number>;
  recent_dreams: DreamRow[];
  php_version: string;
  server_time: string;
}

export interface DreamRow {
  id: number;
  status: string;
  input_mode: string;
  text_preview: string;
  has_image: boolean;
  has_audio: boolean;
  total_comments: number;
  total_reactions: number;
  is_priority: boolean;
  created_at: string;
  processed_at: string | null;
  client_name: string;
}

export interface DreamsListData {
  dreams: DreamRow[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface DreamDetailData {
  dream: DreamRow & {
    dream_text: string;
    interpretation: string;
    image_path: string | null;
    narration_audio_path: string | null;
    audio_path: string | null;
    error_message: string | null;
    transcription: string | null;
    fingerprint: string;
  };
  comments: Comment[];
  reactions: { reaction_type: string; count: number }[];
}

export interface Comment {
  id: number;
  author_name: string;
  comment_text: string;
  created_at: string;
  deleted_at: string | null;
}

export interface UserRow {
  id: number;
  name: string;
  fingerprint: string;
  active: number;
  created_at: string;
  last_used_at: string | null;
  dream_count: number;
}

export interface UsersListData {
  users: UserRow[];
  total: number;
  page: number;
  total_pages: number;
}

export interface UserDetailData {
  user: UserRow;
  dreams: DreamRow[];
  donation_stats: { count: number; total_cents: number };
}

export interface DonationRow {
  id: number;
  status: string;
  amount_cents: number;
  txid: string;
  customer_name: string;
  customer_email: string;
  customer_tax_id: string;
  created_at: string;
  confirmed_at: string | null;
  dream_id: number | null;
  client_name: string;
}

export interface DonationsData {
  donations: DonationRow[];
  total: number;
  page: number;
  total_pages: number;
  totals: Record<string, number | string>;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  data?: unknown;
}

export interface LogsData {
  entries: LogEntry[];
  file: string;
  size_bytes: number;
  total_lines: number;
  files: Record<string, { exists: boolean; size_bytes: number; modified: string | null }>;
}

export interface StorageFile {
  name: string;
  path: string;
  size_bytes: number;
  modified: string;
  orphan: boolean;
}

export interface StorageData {
  type: string;
  files: StorageFile[];
  summary: Record<string, { count: number; size_bytes: number }>;
}

export interface Setting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}
