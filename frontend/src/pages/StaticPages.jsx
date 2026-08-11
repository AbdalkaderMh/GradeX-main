import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SimpleLayout = ({ title, children }) => {
  const { settings } = useAuth();

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav flex flex-row-reverse justify-between items-center w-full px-4 lg:px-8 py-4 editorial-shadow">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-blue-900 font-headline tracking-tight">
            {settings.schoolName}
          </h1>
        </div>

        <h2 className="text-lg font-bold text-on-surface-variant/70">
          {title}
        </h2>
      </header>

      <main className="flex-grow pt-32 pb-20 px-6 max-w-4xl mx-auto w-full">
        {children}
      </main>

      <footer className="w-full py-8 px-6 flex flex-col items-center justify-center space-y-4 border-t border-surface-container">
        <Link
          to="/about"
          className="text-xs font-medium text-outline-variant hover:text-primary transition-colors"
        >
          إدارة المشروع البرمجي: {settings.developerName}
        </Link>

        <div className="flex gap-6 text-sm font-semibold text-on-surface-variant/60">
          <Link className="hover:text-primary transition-colors" to="/">
            الرئيسية
          </Link>
          <Link className="hover:text-primary transition-colors" to="/privacy">
            سياسة الخصوصية
          </Link>
          <Link className="hover:text-primary transition-colors" to="/support">
            الدعم الفني
          </Link>
        </div>
      </footer>
    </div>
  );
};

/* =========================
   Privacy Page
========================= */
export const PrivacyPage = () => (
  <SimpleLayout title="سياسة الخصوصية">
    <div className="bg-white p-10 rounded-[40px] oceanic-shadow space-y-8 text-right">
      <h3 className="text-3xl font-black font-headline text-primary">
        سياسة الخصوصية
      </h3>

      <p className="text-on-surface-variant leading-relaxed">
        في GradeX، نلتزم بحماية خصوصية بياناتك الأكاديمية. تهدف هذه السياسة إلى
        توضيح كيفية تعاملنا مع المعلومات:
      </p>

      <div className="space-y-6">
        <section>
          <h4 className="text-xl font-bold mb-2">1. جمع البيانات</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            نقوم بجمع البيانات الأكاديمية الضرورية فقط لعرض النتائج وتتبع الأداء
            الدراسي، والتي يتم رفعها من قبل الإدارة المدرسية المعتمدة.
          </p>
        </section>

        <section>
          <h4 className="text-xl font-bold mb-2">2. أمن المعلومات</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            تُشفر كلمات المرور باستخدام تقنيات متقدمة، ولا يتم مشاركة أي بيانات
            شخصية مع أطراف ثالثة خارج نطاق المؤسسة التعليمية.
          </p>
        </section>

        <section>
          <h4 className="text-xl font-bold mb-2">3. وصول الطلاب</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            لكل طالب الحق في الوصول إلى بياناته الخاصة فقط عبر اسم مستخدم وكلمة
            مرور فريدة يتم توليدها آلياً.
          </p>
        </section>
      </div>
    </div>
  </SimpleLayout>
);

/* =========================
   Contact Page
========================= */
export const ContactPage = () => (
  <SimpleLayout title="اتصل بنا">
    <div className="bg-white p-10 rounded-[40px] oceanic-shadow space-y-10 text-right text-center">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
        <span className="material-symbols-outlined text-5xl">
          contact_support
        </span>
      </div>

      <div className="space-y-4">
        <h3 className="text-3xl font-black font-headline">نحن هنا للمساعدة</h3>
        <p className="text-on-surface-variant">
          يمكنكم التواصل مع إدارة المدرسة أو فريق الدعم الفني عبر الوسائل
          التالية:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-surface-container-low rounded-3xl border border-surface-container">
          <span className="material-symbols-outlined text-primary mb-2">
            mail
          </span>
          <h5 className="font-bold">البريد الإلكتروني</h5>
          <p className="text-sm text-on-surface-variant">
            support@scholarly-ethereal.com
          </p>
        </div>

        <div className="p-8 bg-surface-container-low rounded-3xl border border-surface-container">
          <span className="material-symbols-outlined text-primary mb-2">
            call
          </span>
          <h5 className="font-bold">رقم الهاتف</h5>
          <p className="text-sm text-on-surface-variant">
            المكتب الفني: 078XXXXXXX
          </p>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant opacity-60">
        ساعات العمل: الأحد - الخميس | 8:00 ص - 3:00 م
      </p>
    </div>
  </SimpleLayout>
);

/* =========================
   About Page
========================= */
export const AboutPage = () => {
  const { settings } = useAuth();

  return (
    <SimpleLayout title="عن المطور">
      <div className="bg-white p-12 rounded-[40px] oceanic-shadow text-center space-y-8">
        <div className="w-32 h-32 academic-gradient rounded-3xl rotate-12 flex items-center justify-center text-white mx-auto shadow-xl overflow-hidden p-4">
          {settings.logo ? (
            <img
              src={settings.logo}
              alt="Logo"
              className="w-full h-full object-contain -rotate-12"
            />
          ) : (
            <span className="material-symbols-outlined text-6xl -rotate-12">
              auto_awesome
            </span>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-4xl font-black font-headline bg-gradient-to-br from-blue-800 to-blue-500 bg-clip-text text-transparent">
            {settings.developerName}
          </h3>
          <p className="text-lg font-bold text-on-surface-variant">
            حلول تقنية تعليمية مبتكرة
          </p>
        </div>

        <p className="max-w-2xl mx-auto text-on-surface-variant leading-relaxed text-right">
          نسعى دائماً إلى إعادة تعريف تجربة إدارة التعليم من خلال واجهات مستخدم
          متطورة وأنظمة بيانات ذكية. مشروع {settings.schoolName} هو نتاج رؤيتنا
          لتبسيط الوصول إلى النتائج الأكاديمية وتعزيز التواصل بين المؤسسة
          والطالب.
        </p>

        <div className="flex justify-center gap-4">
          <div className="px-6 py-2 bg-surface-container rounded-full text-sm font-bold">
            إتقان
          </div>
          <div className="px-6 py-2 bg-surface-container rounded-full text-sm font-bold">
            بساطة
          </div>
          <div className="px-6 py-2 bg-surface-container rounded-full text-sm font-bold">
            أمان
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};
