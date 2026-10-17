import { createPortal } from "react-dom";
import Certificate from "./Certificate";

/**
 * Renders the yellow result sheet (Certificate) outside the app root, hidden on screen.
 * When the user prints (window.print()), everything else in <body> is hidden and
 * only this sheet is printed on a single A4 page.
 */
export default function PrintCertificate({ student, settings }) {
  if (!student || typeof document === "undefined") return null;

  return createPortal(
    <div id="print-certificate-root">
      <style>{`
        @page { size: A4; margin: 0; }
        #print-certificate-root { display: none; }
        @media print {
          body > *:not(#print-certificate-root) { display: none !important; }
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          #print-certificate-root { display: block !important; }
          #print-certificate-root, #print-certificate-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <Certificate student={student} settings={settings} />
    </div>,
    document.body
  );
}
