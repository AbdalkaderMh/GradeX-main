import Skeleton from "../components/Skeleton";
import { useNotification } from "../context/NotificationContext";
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Certificate from "../components/Certificate";
import EmptyState from "../components/EmptyState";
import Footer from "../components/Footer";

export default function StudentDashboard() {
  const { showNotification } = useNotification();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({ maxTotal: 100 });
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    api.get("/admin/options").then(res => setOptions(res.data)).catch(() => {});
    api.get("/student/me")
      .then((res) => {
        setData(res.data);
      })
      .catch(err => {
        console.error("Failed to fetch student data", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="lg:mr-64 pt-24 px-4 lg:px-8 pb-12 min-h-screen">
          <div className="mb-10 space-y-4">
              <div className="h-10 bg-surface-container-high rounded-xl w-64 animate-pulse"></div>
              <div className="h-4 bg-surface-container-high rounded-xl w-80 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-12 gap-8 mb-10">
              <div className="col-span-12 lg:col-span-8 h-64 bg-surface-container-high rounded-[2.5rem] animate-pulse"></div>
              <div className="col-span-12 lg:col-span-4 h-64 bg-surface-container-high rounded-[2.5rem] animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-surface-container-high rounded-[2rem] animate-pulse"></div>)}
          </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="lg:mr-64 pt-24 px-8 pb-12 min-h-screen flex flex-col items-center justify-center">
        <EmptyState
            icon="lock"
            title="النتائج غير متاحة حالياً"
            message="يرجى مراجعة شؤون الطلاب أو العودة لاحقاً عند نشر النتائج رسمياً من قبل الإدارة."
        />
      </main>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleTermRecords = () => {
    showNotification("هذا هو السجل الأكاديمي للفصل الحالي. لا توجد سجلات سابقة متوفرة حالياً.", "info");
  };

  const handleShare = async () => {
    try {
        setSharing(true);
        const res = await api.post("/student/share");
        setShareUrl(res.data.shareUrl);
        await navigator.clipboard.writeText(res.data.shareUrl);
        showNotification("تم نسخ رابط المشاركة إلى الحافظة", "success");
    } catch (err) {
        showNotification("فشل إنشاء رابط المشاركة", "error");
    } finally {
        setSharing(false);
    }
  };

  if (showCertificate) {
    return (
        <main className="lg:mr-64 pt-24 px-4 lg:px-8 pb-12 min-h-screen bg-surface-container-lowest/20">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex justify-between items-center print:hidden">
                    <button
                        onClick={() => setShowCertificate(false)}
                        className="bg-surface-container-high px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-surface-container-highest transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_forward</span>
                        العودة للوحة التحكم
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-primary text-on-primary px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors shadow-lg"
                    >
                        <span className="material-symbols-outlined">print</span>
                        طباعة الشهادة
                    </button>
                </div>

                <div className="certificate-wrapper bg-white p-12 rounded-[40px] shadow-2xl overflow-x-auto">
                    <Certificate student={data} settings={options} />
                </div>
            </div>
        </main>
    );
  }

  const isAverage = data.scoringType !== "sum";
  const scoreValue = data.average || 0;

  const performanceLevel = isAverage ?
    (scoreValue >= 90 ? "ممتاز" : scoreValue >= 80 ? "جيد جداً" : scoreValue >= 70 ? "جيد" : scoreValue >= 50 ? "مقبول" : "ضعيف") :
    "مكتمل";

  const performanceColor = isAverage ?
    (scoreValue >= 90 ? "text-green-600" : scoreValue >= 70 ? "text-primary" : "text-red-600") :
    "text-primary";

  return (
    <main className="lg:mr-64 pt-20 lg:pt-24 px-4 lg:px-8 pb-12 min-h-screen print:mr-0 print:pt-0">
      {/* Header Section */}
      <section className="mb-8 lg:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] lg:text-xs font-bold rounded-full">{data.resultTitle || "النتائج الحالية"}</span>
                <span className="text-on-surface-variant text-[10px] lg:text-xs font-mono">{data.academicYear}</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-1">مرحباً، {data.name.split(' ')[0]} 👋</h2>
            <p className="text-on-surface-variant text-base lg:text-lg">إليك ملخص لأدائك الأكاديمي الحالي.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto print:hidden">
            <button onClick={handlePrint} className="flex-1 md:flex-none p-3 bg-surface-container-high rounded-2xl text-on-surface hover:bg-surface-container-highest transition-all shadow-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">print</span>
                <span className="md:hidden font-bold">طباعة</span>
            </button>
            <button
                onClick={handleShare}
                disabled={sharing}
                className="flex-[2] md:flex-none px-6 py-3 academic-gradient text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <span className="material-symbols-outlined text-sm">{sharing ? 'sync' : 'share'}</span>
                <span>{shareUrl ? 'تم النسخ' : 'مشاركة النتائج'}</span>
            </button>
        </div>
      </section>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* GPA Summary Card */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-3xl p-6 lg:p-10 oceanic-shadow h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-10 items-center">
                <div className="relative shrink-0">
                    <svg className="w-40 h-40 lg:w-48 lg:h-48 transform -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-surface-container-high" />
                        <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="283" strokeDashoffset={isAverage ? (283 - (283 * scoreValue) / 100) : 0} strokeLinecap="round" className="text-primary transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl lg:text-5xl font-black text-primary">{scoreValue}{isAverage ? "%" : ""}</span>
                        <span className={`text-xs lg:text-sm font-bold ${performanceColor}`}>{performanceLevel}</span>
                    </div>
                </div>

                <div className="flex-1 space-y-6 text-center md:text-right">
                    <div>
                        <h3 className="text-xl lg:text-2xl font-black font-headline mb-2">أداؤك العام</h3>
                        <p className="text-on-surface-variant text-sm lg:text-base leading-relaxed">
                            {data.average >= 90 ? "أداء استثنائي! استمر في هذا المستوى الرائع." :
                             data.average >= 70 ? "أداء جيد جداً، لديك القدرة على تحقيق المزيد." :
                             "تحتاج إلى بذل مزيد من الجهد في المواد القادمة لتحسين معدلك."}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-surface-container rounded-2xl">
                            <span className="block text-[10px] lg:text-xs text-on-surface-variant mb-1 font-bold">المجموع</span>
                            <span className="text-xl lg:text-2xl font-black text-on-surface">{data.total}</span>
                        </div>
                        <div className="p-4 bg-surface-container rounded-2xl">
                            <span className="block text-[10px] lg:text-xs text-on-surface-variant mb-1 font-bold">الرتبة</span>
                            <span className="text-xl lg:text-2xl font-black text-on-surface">#{data.rank} <span className="text-[10px] lg:text-xs font-normal">من {data.totalPeers}</span></span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Study Info */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-8 editorial-shadow">
            <h3 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                الملف الأكاديمي
            </h3>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined">school</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">القسم</p>
                        <p className="text-sm font-bold">{data.department}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined">layers</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">المستوى</p>
                        <p className="text-sm font-bold">{data.grade}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined">groups</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">الشعبة</p>
                        <p className="text-sm font-bold">شعبة ({data.section})</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-primary-container/10 p-6 rounded-3xl border border-primary-container/20">
              <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                توصية ذكية
              </h4>
              <div className="text-xs text-on-primary-container/80 leading-relaxed space-y-2">
                {(() => {
                  const failing = data.subjects.filter(s => (s.currentScore || 0) < 50);
                  const weak = data.subjects.filter(s => (s.currentScore || 0) >= 50 && (s.currentScore || 0) < 70);
                  const percentile = (data.rank / data.totalPeers) * 100;

                  if (failing.length > 0) {
                    return (
                      <div className="space-y-2">
                        <p>
                          تحتاج إلى التركيز بشكل عاجل على المواد التالية حيث أن درجاتك فيها دون مستوى النجاح:
                          <span className="font-bold block mt-1 text-red-600">{failing.map(s => s.name).join('، ')}</span>
                        </p>
                        <p className="text-[10px] opacity-70 italic border-t border-primary/10 pt-2">
                            نصيحة: ابدأ بمراجعة الدروس الأساسية في {failing[0].name} وخصص وقتاً إضافياً لحل التمارين العملية.
                        </p>
                      </div>
                    );
                  }

                  if (percentile > 50 && weak.length > 0) {
                      return (
                        <div className="space-y-2">
                            <p>
                                أنت في الترتيب ( {data.rank} ) من أصل ( {data.totalPeers} ). لتحسين ترتيبك العام، ركز على تقوية درجاتك في:
                                <span className="font-bold block mt-1 text-primary">{weak.map(s => s.name).join('، ')}</span>
                            </p>
                        </div>
                      );
                  }

                  if (weak.length > 0) {
                    return (
                      <div className="space-y-2">
                        <p>
                          أداؤك جيد، ولكن يمكنك رفع معدلك بشكل كبير من خلال تحسين درجاتك في:
                          <span className="font-bold block mt-1 text-primary">{weak.map(s => s.name).join('، ')}</span>
                        </p>
                        <p className="text-[10px] opacity-70 italic border-t border-primary/10 pt-2">
                            نصيحة: أنت قريب جداً من التفوق في {weak[0].name}. المراجعة المركزة قبل الاختبار القادم ستحدث فرقاً كبيراً.
                        </p>
                      </div>
                    );
                  }

                  if (data.rank <= 3) {
                      return <p className="font-bold text-primary animate-bounce">أنت من أوائل القسم! حافظ على هذا المستوى الرائع للوصول للقمة دائماً. 🏆</p>;
                  }

                  return <p>أداء مذهل في جميع المواد! استمر على هذا النهج للحفاظ على تفوقك.</p>;
                })()}
              </div>
          </div>

          <div className="bg-white rounded-3xl p-6 oceanic-shadow border border-surface-container">
             <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                اكتمال السجل
             </h4>
             <div className="flex items-center gap-4">
                 <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                     <div className="h-full bg-primary" style={{ width: `${(data.subjects.length / 8) * 100}%` }}></div>
                 </div>
                 <span className="text-xs font-black">{data.subjects.length} / 8</span>
             </div>
             <p className="text-[10px] text-outline mt-2">تم رصد {data.subjects.length} مواد من أصل 8 متوقعة لهذا الفصل.</p>
          </div>
        </div>


        {/* Grades List (Card Based) */}
        <div className="col-span-12">
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">fact_check</span>
                    </div>
                    <h3 className="text-2xl font-black font-headline">تفاصيل الدرجات</h3>
                </div>

                <div className="flex flex-wrap justify-center gap-2 print:hidden">
                    <button onClick={handlePrint} className="px-4 py-2 bg-white oceanic-shadow rounded-xl text-xs font-bold hover:bg-surface-container-low transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        <span>تصدير</span>
                    </button>
                    {options.isCertificateEnabled && (
                        <button
                            onClick={() => setShowCertificate(true)}
                            className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">workspace_premium</span>
                            <span>الشهادة</span>
                        </button>
                    )}
                    <button onClick={handleTermRecords} className="px-4 py-2 bg-white oceanic-shadow rounded-xl text-xs font-bold">السجل</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.subjects?.map((subject, idx) => (
                    <div key={idx} className="bg-white rounded-[2rem] p-6 oceanic-shadow border border-surface-container group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs group-hover:bg-primary group-hover:text-white transition-all">
                                    {idx + 1}
                                </div>
                                <h4 className="font-black text-lg">{subject.name}</h4>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${subject.currentScore >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {subject.currentScore >= 50 ? 'ناجح' : 'راسب'}
                            </div>
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase mb-1">الدرجة الحالية</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-4xl font-black ${subject.currentScore >= 50 ? 'text-primary' : 'text-red-600'}`}>
                                        {subject.currentScore || "0"}
                                    </span>
                                    <span className="text-xs text-outline font-bold">/ {options.maxTotal}</span>
                                </div>
                            </div>

                            <div className="text-left">
                                {subject.improved && (
                                    <div className="flex items-center gap-1 text-green-600 font-bold mb-1">
                                        <span className="material-symbols-outlined text-sm">trending_up</span>
                                        <span className="text-[10px]">تحسن</span>
                                    </div>
                                )}
                                <p className="text-[10px] text-outline font-bold">السابق: {subject.previousScore || "0"}</p>
                            </div>
                        </div>

                        {/* History Chart Mini */}
                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between items-end h-16 gap-2 px-2">
                                <div className="flex-1 flex flex-col items-center gap-1 group/bar">
                                    <div
                                        className="w-full bg-surface-container-high rounded-t-lg transition-all duration-700 relative"
                                        style={{ height: `${(subject.previousScore / options.maxTotal) * 100}%` }}
                                    >
                                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">{subject.previousScore}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-outline uppercase">السابق</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center gap-1 group/bar">
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-1000 delay-300 relative ${subject.currentScore >= 50 ? 'bg-primary' : 'bg-error'}`}
                                        style={{ height: `${(subject.currentScore / options.maxTotal) * 100}%` }}
                                    >
                                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">{subject.currentScore}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-primary uppercase">الحالي</span>
                                </div>
                            </div>

                            {data.comparison && data.comparison[subject.name] && (
                                <div className="pt-3 border-t border-surface-container flex justify-between items-center px-1">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] text-outline font-bold">متوسط الدفعة</span>
                                        <span className="text-[10px] font-black text-on-surface">{data.comparison[subject.name].avg}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[7px] text-outline font-bold">أعلى درجة</span>
                                        <span className="text-[10px] font-black text-tertiary">{data.comparison[subject.name].max}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {subject.details && Object.keys(subject.details).length > 0 && (
                            <button
                                onClick={() => setExpandedSubject(expandedSubject === idx ? null : idx)}
                                className="w-full mt-4 py-2 text-[10px] font-bold text-outline hover:text-primary transition-colors flex items-center justify-center gap-1 border-t border-surface-container-high"
                            >
                                {expandedSubject === idx ? "إخفاء التفاصيل" : "عرض تفاصيل المادة"}
                                <span className="material-symbols-outlined text-sm">
                                    {expandedSubject === idx ? 'expand_less' : 'expand_more'}
                                </span>
                            </button>
                        )}

                        {expandedSubject === idx && (
                            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                {subject.details && Object.keys(subject.details).length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(subject.details).map(([key, val]) => (
                                            <div key={key} className="bg-surface-container-low p-2 rounded-xl flex flex-col items-center">
                                                <span className="text-[9px] text-on-surface-variant font-bold">{key}</span>
                                                <span className="text-sm font-black text-primary">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {subject.history && subject.history.length > 0 && (
                                    <div className="pt-4 border-t border-surface-container">
                                        <p className="text-[10px] font-black text-on-surface-variant mb-3 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">history</span>
                                            تاريخ الدرجات المسجلة
                                        </p>
                                        <div className="space-y-2">
                                            {subject.history.map((h, hi) => (
                                                <div key={hi} className="flex justify-between items-center text-[10px] bg-surface-container-lowest p-2 rounded-lg border border-surface-container">
                                                    <span className="font-bold text-outline">{h.round}</span>
                                                    <span className="font-black text-primary">{h.score} درجة</span>
                                                    <span className="text-[8px] opacity-50">{new Date(h.uploadedAt).toLocaleDateString('ar-EG')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {(!data.subjects || data.subjects.length === 0) && (
                <div className="bg-white rounded-[3rem] oceanic-shadow overflow-hidden">
                    <EmptyState
                        icon="assignment_late"
                        title="لا توجد درجات مسجلة"
                        message="لم يتم رصد أي درجات لحسابك في هذا الفصل الدراسي حتى الآن."
                    />
                </div>
            )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
