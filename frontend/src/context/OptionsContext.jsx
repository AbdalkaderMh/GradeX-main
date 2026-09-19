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
    const token = localStorage.getItem("token");

    if (token) {
      // يوجد توكن بالفعل عند تحميل التطبيق (جلسة سابقة صالحة) → اجلب الخيارات فوراً.
      fetchOptions();
    } else {
      // لا يوجد توكن بعد (المستخدم لم يسجّل دخوله بعد).
      // بدلاً من الفشل بصمت والبقاء عالقاً بدون بيانات إلى الأبد،
      // ننتظر ظهور التوكن (يحدث فور نجاح تسجيل الدخول) ثم نجلب الخيارات تلقائياً.
      setLoading(false);
      const interval = setInterval(() => {
        const t = localStorage.getItem("token");
        if (t) {
          clearInterval(interval);
          fetchOptions(true);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <OptionsContext.Provider value={{ options, loading, refreshOptions: () => fetchOptions(true) }}>
      {children}
    </OptionsContext.Provider>
  );
};
