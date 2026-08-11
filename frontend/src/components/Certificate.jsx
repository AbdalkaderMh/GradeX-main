import React from 'react';

const Certificate = ({ student, settings }) => {
  if (!student) return null;

  const schoolName = settings?.schoolName || "إعدادية هيت المهنية";
  const academicYear = student.academicYear || "2025 - 2026";

  // Calculate the result (Pass/Fail)
  const isPassing = (grade) => parseFloat(grade) >= 50;
  const overallResult = student.subjects.every(s => isPassing(s.currentScore)) ? "ناجح" : "راسب";

  return (
    <div className="certificate-container bg-[#FFD700] p-8 font-['Be_Vietnam_Pro'] text-right dir-rtl min-h-[1122px] w-[794px] mx-auto border-[12px] border-double border-black relative overflow-hidden" id="student-certificate">
      {/* Background patterns could be added here */}

      {/* Header Section */}
      <div className="flex justify-between items-start mb-10">
        <div className="w-1/3 space-y-2">
            <h1 className="text-xl font-bold">وزارة التربية</h1>
            <h2 className="text-lg font-bold leading-tight">المديرية العامة للتعليم المهني</h2>
            <h2 className="text-lg font-bold leading-tight">قسم التعليم المهني في الأنبار</h2>
            <h2 className="text-xl font-black underline decoration-2 underline-offset-4">{schoolName}</h2>
        </div>

        <div className="w-1/3 flex flex-col items-center">
            <div className="w-24 h-24 mb-2">
                {/* Ministry Logo Placeholder */}
                <div className="w-full h-full border-2 border-black rounded-full flex items-center justify-center italic text-[10px] text-center px-1">
                    شعار وزارة التربية
                </div>
            </div>
            <p className="text-sm font-bold">نتائج الطلبة للعام الدراسي ( {academicYear} )</p>
        </div>

        <div className="w-1/3 border-2 border-black p-4 rounded-xl bg-white/20 backdrop-blur-sm">
            <div className="space-y-3">
                <div className="flex gap-2 border-b border-black/20 pb-1">
                    <span className="font-bold whitespace-nowrap">الاسم /</span>
                    <span className="font-black text-lg">{student.name}</span>
                </div>
                <div className="flex gap-2 border-b border-black/20 pb-1">
                    <span className="font-bold whitespace-nowrap">الصف /</span>
                    <span>{student.grade} مهني - {student.section}</span>
                </div>
                <div className="flex gap-2 border-b border-black/20 pb-1">
                    <span className="font-bold whitespace-nowrap">الفرع /</span>
                    <span>{student.department}</span>
                </div>
                <div className="flex gap-2">
                    <span className="font-bold whitespace-nowrap">الاختصاص /</span>
                    <span>{student.specialty || student.department}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-8">
          <div className="inline-block relative">
              <div className="absolute inset-0 bg-black -skew-x-12 transform translate-y-1"></div>
              <h2 className="relative z-10 bg-white border-2 border-black px-12 py-2 text-3xl font-black -skew-x-12">
                  التعليم المهني شهادة ومهنة
              </h2>
          </div>
      </div>

      {/* Table Section */}
      <div className="border-2 border-black rounded-lg overflow-hidden bg-white/10">
        <table className="w-full border-collapse">
            <thead>
                <tr className="bg-black/5">
                    <th className="border border-black p-2 text-xs font-bold w-10">ت</th>
                    <th className="border border-black p-2 text-sm font-bold">اسم المادة</th>
                    <th className="border border-black p-2 text-[10px] font-bold w-16">درجة الفصل الأول %100</th>
                    <th className="border border-black p-2 text-[10px] font-bold w-16">درجة نصف السنة %100</th>
                    <th className="border border-black p-2 text-[10px] font-bold w-16">درجة الفصل الثاني %100</th>
                    <th className="border border-black p-2 text-[10px] font-bold w-16">السعي السنوي %100</th>
                    <th className="border border-black p-2 text-[10px] font-bold w-16">درجة الامتحان النهائي %100</th>
                    <th className="border border-black p-2 text-[10px] font-bold w-16">الدرجة النهائية %100</th>
                    <th className="border border-black p-2 text-[10px] font-bold w-16">درجة الإكمال %100</th>
                    <th className="border border-black p-2 text-[10px] font-bold w-16">الدرجة بعد الإكمال %100</th>
                </tr>
            </thead>
            <tbody>
                {student.subjects.map((subject, index) => (
                    <tr key={index} className="h-10">
                        <td className="border border-black text-center font-bold text-xs">{index + 1}</td>
                        <td className="border border-black px-3 font-bold text-sm">{subject.name}</td>
                        <td className="border border-black text-center font-black">{subject.details?.['درجة الفصل الأول'] || subject.details?.['الفصل الأول'] || ''}</td>
                        <td className="border border-black text-center font-black">{subject.details?.['نصف السنة'] || ''}</td>
                        <td className="border border-black text-center font-black">{subject.details?.['درجة الفصل الثاني'] || subject.details?.['الفصل الثاني'] || ''}</td>
                        <td className="border border-black text-center font-black">{subject.details?.['السعي السنوي'] || ''}</td>
                        <td className="border border-black text-center font-black">{subject.details?.['الامتحان النهائي'] || ''}</td>
                        <td className="border border-black text-center font-black bg-black/5">{subject.currentScore}</td>
                        <td className="border border-black text-center font-black">{subject.details?.['درجة الإكمال'] || ''}</td>
                        <td className="border border-black text-center font-black">{subject.details?.['بعد الإكمال'] || ''}</td>
                    </tr>
                ))}
                {/* Empty rows if subjects < 12 */}
                {Array.from({ length: Math.max(0, 11 - student.subjects.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-10">
                        <td className="border border-black text-center text-xs opacity-20">{student.subjects.length + i + 1}</td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                    </tr>
                ))}
                <tr className="h-10 bg-black/5">
                    <td colSpan="7" className="border border-black text-center font-bold text-lg">المجموع</td>
                    <td className="border border-black text-center font-black text-xl">{student.total}</td>
                    <td colSpan="2" className="border border-black"></td>
                </tr>
                <tr className="h-14">
                    <td colSpan="7" className="border border-black text-center font-bold text-xl">النتيجة</td>
                    <td colSpan="3" className="border border-black text-center">
                        <div className="flex flex-col justify-center h-full">
                            <span className={`font-black text-2xl ${overallResult === 'ناجح' ? 'text-green-800' : 'text-red-800'}`}>
                                {student.round === "الثاني" ? `ناجح / الدور الثاني` : overallResult}
                            </span>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-12 flex justify-between items-end">
          <div className="w-1/3 text-center">
              <div className="w-48 h-24 border-2 border-dashed border-black mx-auto mb-2 flex items-center justify-center opacity-30 italic text-xs">
                  ختم المدرسة
              </div>
          </div>

          <div className="w-1/3 text-center space-y-4">
              <div className="border-2 border-black p-2 inline-block">
                  <span className="text-xl font-bold px-4">[ {student.serialNo || ' '} ]</span>
              </div>
              <div className="font-bold">
                  <p>{schoolName}</p>
                  <p>الوثائق / الشهادات</p>
                  <p>{academicYear.split('-')[0].trim()}</p>
              </div>
          </div>

          <div className="w-1/3 text-center">
              <div className="mb-2">
                  <div className="w-32 h-16 mx-auto bg-black/5 border-b-2 border-black"></div>
              </div>
              <p className="font-black text-lg">بشار جندي عبدالجبار</p>
              <p className="font-bold">مدير الإعدادية</p>
          </div>
      </div>

      {/* Ribbon Ornament */}
      <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden">
          <div className="bg-black text-white text-[10px] font-bold py-1 px-10 transform rotate-45 translate-x-10 translate-y-2">
              نسخة أصلية
          </div>
      </div>
    </div>
  );
};

export default Certificate;
