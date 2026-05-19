/**
 * Lightweight client-side activity list (no backend audit API).
 * Stored per-user in localStorage for demo purposes only.
 */

const STORAGE_KEY = 'vehiclerental_activity_logs_v1';

const readAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeAll = (obj) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
};

export const getUserLogs = async (userId) => {
  const all = readAll();
  const list = all[userId];
  return Array.isArray(list) ? list : [];
};

export const addLog = async (userId, event, device = 'Web Browser', location = 'Unknown') => {
  const all = readAll();
  const list = Array.isArray(all[userId]) ? all[userId] : [];
  const entry = {
    id: `log-${Date.now()}`,
    event,
    device,
    location,
    time: new Date().toISOString(),
  };
  list.unshift(entry);
  all[userId] = list;
  writeAll(all);
  return entry;
};
