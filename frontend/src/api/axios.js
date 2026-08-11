import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL + "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "حدث خطأ غير متوقع";

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/") {
          window.location.href = "/";
      }
    } else if ([403, 429, 500].includes(status)) {
        // We can't use useNotification here as it's outside React.
        // We will dispatch a custom event that NotificationContext can listen to.
        window.dispatchEvent(new CustomEvent("api-error", { detail: { message, status } }));
    }

    return Promise.reject(error);
  }
);

export default api;
