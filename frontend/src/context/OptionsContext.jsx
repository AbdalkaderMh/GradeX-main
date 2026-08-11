import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const OptionsContext = createContext();

export const useOptions = () => useContext(OptionsContext);

export const OptionsProvider = ({ children }) => {
  const [options, setOptions] = useState({ grades: [], departments: [], sections: [] });
  const [loading, setLoading] = useState(true);

  const fetchOptions = async (force = false) => {
    if (!force && options.grades.length > 0) return;
    try {
      setLoading(true);
      const res = await api.get("/admin/options");
      setOptions(res.data);
    } catch (err) {
      console.error("Failed to fetch options", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  return (
    <OptionsContext.Provider value={{ options, loading, refreshOptions: () => fetchOptions(true) }}>
      {children}
    </OptionsContext.Provider>
  );
};
