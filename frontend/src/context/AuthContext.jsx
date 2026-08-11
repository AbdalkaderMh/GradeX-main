/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [settings, setSettings] = useState({
    schoolName: "GradeX",
    logo: "/logo.png",
    developerName: "عبدالقادر محمد"
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/auth/settings");
      const data = response.data;
      if (data) {
        setSettings({
          schoolName: data.schoolName || "GradeX",
          logo: data.logo || "/logo.png",
          developerName: data.developerName || "عبدالقادر محمد"
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedRole) {
      setToken(storedToken);
      setRole(storedRole);
      if (storedUser) {
          try {
              setUser(JSON.parse(storedUser));
          } catch (e) {
              console.error("Failed to parse stored user");
          }
      }
    }
    fetchSettings().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (settings.schoolName) {
      document.title = settings.schoolName;
    }
    if (settings.logo) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.logo;
    }
  }, [settings]);

  const login = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("user", JSON.stringify(userData.user));
    setToken(userData.token);
    setRole(userData.role);
    setUser(userData.user);
  };

  const updateAuthUser = (userData) => {
    const newUser = { ...user, ...userData };
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setToken(null);
    setRole(null);
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout, updateAuthUser, loading, settings, refreshSettings: fetchSettings }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
