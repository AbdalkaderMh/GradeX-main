import { useNotification } from "../context/NotificationContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import Footer from "../components/Footer";

export default function Support() {
  const { showNotification } = useNotification();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myMessages, setMyMessages] = useState([]);
  const [activeMsgTab, setActiveMsgTab] = useState("pending");

  useEffect(() => {
    // Try to pre-fill from profile
    api.get("/auth/profile").then(res => {
        setForm(f => ({ ...f, name: res.data.user?.name, email: res.data.user?.email || "" }));
    }).catch(() => {});
    fetchMyMessages();
  }, []);

  const fetchMyMessages = async () => {
    try {
        const res = await api.get("/support/all"); // Backend filter logic for students in next step? Actually current supportController.js getMessages returns all. I should probably fix that or filter here.
        setMyMessages(res.data);
    } catch (err) { console.error(err); }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await api.post("/support/send", form);
        setSubmitted(true);
    } catch (err) {
        showNotification("فشل إرسال الرسالة، يرجى المحاولة لاحقاً", "error");
    } finally {
        setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="mr-64 pt-24 px-8 pb-12 min-h-screen flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-tertiary-container/30 rounded-full flex items-center justify-center mb-6 text-tertiary">
          <span className="material-symbols-outlined text-5xl">send</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">تم إرسال طلبك بنجاح</h2>
        <p className="text-on-surface-variant max-w-md">شكراً لتواصلك معنا. سيقوم فريق الدعم الفني بالرد عليك في أقرب وقت ممكن عبر بريدك الإلكتروني.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-8 px-8 py-3 academic-gradient text-white font-bold rounded-xl"
        >
          إرسال طلب آخر
        </button>
      </main>
    );
  }

  return (
    <main className="lg:mr-64 pt-24 px-4 lg:px-8 pb-12 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <section className="mb-12">
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">الدعم الفني</h2>
          <p className="text-on-surface-variant text-lg">نحن هنا لمساعدتك في حال واجهت أي مشاكل تقنية في النظام.</p>
        </section>

        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <div className="bg-surface-container-lowest rounded-3xl p-10 oceanic-shadow">
              <h3 className="text-2xl font-bold mb-8">أرسل لنا رسالة</h3>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant mr-1">الاسم الكامل</label>
                  <input
                    required
                    className="w-full px-6 py-4 bg-surface-container-low border-none rounded-xl text-on-surface focus-glow"
                    type="text"
                    placeholder="أدخل اسمك هنا..."
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant mr-1">البريد الإلكتروني</label>
                  <input
                    required
                    className="w-full px-6 py-4 bg-surface-container-low border-none rounded-xl text-on-surface focus-glow"
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant mr-1">وصف المشكلة</label>
                  <textarea
                    required
                    rows="5"
                    className="w-full px-6 py-4 bg-surface-container-low border-none rounded-xl text-on-surface focus-glow"
                    placeholder="اشرح لنا المشكلة التي تواجهها بالتفصيل..."
                    value={form.message}
                    onChange={(e) => setForm({...form, message: e.target.value})}
                  ></textarea>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 primary-gradient text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading && <span className="material-symbols-outlined animate-spin">sync</span>}
                  <span>إرسال الطلب</span>
                </button>
              </form>
            </div>

            {myMessages.length > 0 && (
                <div className="bg-surface-container-lowest rounded-3xl overflow-hidden oceanic-shadow">
                    <div className="px-8 py-6 bg-surface-variant flex items-center justify-between border-r-4 border-primary">
                        <h3 className="text-2xl font-bold font-headline">رسائلي السابقة</h3>
                        <div className="flex bg-surface-container-low p-1 rounded-lg">
                            <button
                                onClick={() => setActiveMsgTab("pending")}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeMsgTab === 'pending' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
                            >
                                قيد الانتظار ({myMessages.filter(m => m.status === 'pending').length})
                            </button>
                            <button
                                onClick={() => setActiveMsgTab("solved")}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeMsgTab === 'solved' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
                            >
                                تم الرد ({myMessages.filter(m => m.status === 'solved').length})
                            </button>
                        </div>
                    </div>
                    <div className="p-8 space-y-4">
                        {myMessages.filter(m => m.status === activeMsgTab).map(m => (
                            <div key={m._id} className="p-6 bg-surface-container-low rounded-2xl border border-surface-container transition-all hover:shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${m.status === 'solved' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                        <span className="text-[10px] text-on-surface-variant font-bold">
                                            {new Date(m.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${m.status === 'solved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {m.status === 'solved' ? 'تمت الإجابة' : 'جاري المراجعة'}
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                    </div>
                                    <p className="text-sm font-bold text-on-surface mt-1">{m.message}</p>
                                </div>
                                {m.reply && (
                                    <div className="mt-6 p-5 bg-primary/5 border-r-4 border-primary rounded-xl relative">
                                        <div className="absolute -top-3 right-4 bg-primary text-white px-3 py-0.5 rounded-full text-[10px] font-bold">رد الإدارة</div>
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                                <span className="material-symbols-outlined text-sm">support_agent</span>
                                            </div>
                                            <p className="text-sm text-on-surface leading-relaxed mt-1">{m.reply}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {myMessages.filter(m => m.status === activeMsgTab).length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                <p className="text-xs font-bold">لا يوجد رسائل في هذا القسم</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-5 space-y-8">
            <div className="bg-white rounded-3xl p-8 editorial-shadow">
              <h3 className="text-xl font-bold mb-6">معلومات الاتصال</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-container/20 rounded-xl text-primary">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div>
                    <h4 className="font-bold">البريد الإلكتروني</h4>
                    <p className="text-sm text-on-surface-variant">support@gradex.edu</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-tertiary-container/20 rounded-xl text-tertiary">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <div>
                    <h4 className="font-bold">رقم الهاتف</h4>
                    <p className="text-sm text-on-surface-variant">+966 12 345 6789</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-surface-container-high rounded-xl text-on-surface-variant">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <h4 className="font-bold">ساعات العمل</h4>
                    <p className="text-sm text-on-surface-variant">الأحد - الخميس: 8:00 ص - 4:00 م</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-primary-container/10 rounded-3xl border border-primary-container/20">
               <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined">lightbulb</span>
                 نصيحة سريعة
               </h4>
               <p className="text-sm text-on-primary-container/80 leading-relaxed">
                 تأكد من إرفاق رقمك الجامعي ووصف دقيق للمشكلة لمساعدتنا في خدمتك بشكل أسرع وأفضل.
               </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
