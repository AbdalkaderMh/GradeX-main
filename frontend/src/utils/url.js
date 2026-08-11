import { API_URL } from "../api/axios";

export const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  if (path.startsWith("/uploads")) return `${API_URL}${path}`;
  return path;
};
