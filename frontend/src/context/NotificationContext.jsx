import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from "../api/axios";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchNotifications();

    const eventSource = new EventSource(`${api.defaults.baseURL}/notifications/stream?token=${token}`);
    eventSource.onmessage = (event) => {
        const newNotif = JSON.parse(event.data);
        setNotifications(prev => [newNotif, ...prev]);
    };
    eventSource.onerror = () => eventSource.close();

    return () => eventSource.close();
  }, [fetchNotifications]);

  const showNotification = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    const handler = (event) => {
        const { message, status } = event.detail;
        showNotification(message, status >= 500 ? "error" : "info");
    };
    window.addEventListener("api-error", handler);
    return () => window.removeEventListener("api-error", handler);
  }, [showNotification]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
        await api.put("/notifications/mark-all-read");
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await api.delete("/notifications/clear-all");
      setNotifications([]);
    } catch (err) { console.error(err); }
  }, []);

  return (
    <NotificationContext.Provider value={{
        showNotification,
        notifications,
        fetchNotifications,
        markAsRead,
        markAllRead,
        clearAllNotifications
    }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full text-right" dir="rtl">
        {toasts.map(n => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-4 duration-300 flex items-center gap-3 border ${
              n.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
              n.type === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {n.type === 'success' ? 'check_circle' : n.type === 'error' ? 'error' : 'info'}
            </span>
            <p className="text-sm font-bold">{n.message}</p>
            <button
                onClick={() => setToasts(prev => prev.filter(notif => notif.id !== n.id))}
                className="mr-auto opacity-50 hover:opacity-100 transition-opacity"
            >
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
