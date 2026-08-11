import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Certificate from "../components/Certificate";
import Footer from "../components/Footer";

export default function SharedResult() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [options, setOptions] = useState({ maxTotal: 100 });

  useEffect(() => {
    api.get("/auth/settings").then(res => setOptions(res.data)).catch(() => {});

    api.get(`/student/shared/${token}`)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "الرابط غير صالح");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold animate-pulse text-primary">جاري تحميل النتيجة...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4">
        <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <h2 className="text-2xl font-black mb-2">{error}</h2>
        <p className="text-on-surface-variant mb-8">عذراً، لا يمكننا العثور على هذه النتيجة حالياً.</p>
        <Link to="/" className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg">العودة للرئيسية</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-container-lowest/20 py-12 px-4">
        <div className="max-w-6xl mx-auto">
            <div className="mb-10 text-center print:hidden">
                <h1 className="text-3xl font-black mb-2 text-primary">نتيجة الطالب المشتركة</h1>
                <p className="text-on-surface-variant">هذه نسخة رسمية من نتائج الطالب المستخرجة من نظام {options.schoolName}</p>
            </div>

            <div className="bg-white p-8 lg:p-12 rounded-[40px] shadow-2xl overflow-x-auto">
                <Certificate student={data} settings={options} />
            </div>

            <div className="mt-12 text-center print:hidden">
                <button onClick={() => window.print()} className="px-10 py-4 academic-gradient text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                    <span className="material-symbols-outlined">print</span>
                    طباعة الشهادة الرسمية
                </button>
            </div>
        </div>
        <div className="mt-20 print:hidden">
            <Footer />
        </div>
    </div>
  );
}
