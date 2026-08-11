import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

export default function Footer({ className = "" }) {
  const { settings } = useAuth();
  return (
    <footer className={`mt-auto py-8 px-6 flex flex-col items-center justify-center space-y-4 border-t border-surface-container/30 print:hidden ${className}`}>
      <div className="flex items-center gap-4 text-outline-variant">
        <div className="h-[1px] w-12 bg-outline-variant/30"></div>
          <Link to="/about" className="text-xs font-medium tracking-wide hover:text-primary transition-colors">إدارة المشروع البرمجي: {settings.developerName}</Link>
        <div className="h-[1px] w-12 bg-outline-variant/30"></div>
      </div>
      <div className="flex gap-6 text-sm font-semibold text-on-surface-variant/60">
        <Link className="hover:text-primary transition-colors" to="/privacy">سياسة الخصوصية</Link>
        <Link className="hover:text-primary transition-colors" to="/support">الدعم الفني</Link>
        <Link className="hover:text-primary transition-colors" to="/contact">اتصل بنا</Link>
      </div>
    </footer>
  );
}
