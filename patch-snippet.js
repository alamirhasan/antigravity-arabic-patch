/**
 * Antigravity Arabic RTL Patch
 * Injected script for smart Arabic RTL detection and English/Code isolation
 */

try {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const latinRegex = /[A-Za-z]/g;

  const determineDirection = (text) => {
    if (!text || text.trim().length === 0) return null;
    const arabicMatches = text.match(arabicRegex) || [];
    const latinMatches = text.match(latinRegex) || [];

    if (arabicMatches.length > 0 && latinMatches.length === 0) return 'rtl';

    const totalLetters = arabicMatches.length + latinMatches.length;
    if (totalLetters === 0) return null;

    // إذا كانت نسبة الحروف العربية 30% أو أكثر، فالنص عربي
    return (arabicMatches.length / totalLetters >= 0.3) ? 'rtl' : 'ltr';
  };

  const applyBidi = () => {
    if (!document.getElementById('antigravity-arabic-patch-style')) {
      const s = document.createElement('style');
      s.id = 'antigravity-arabic-patch-style';
      s.textContent = `
        /* إبقاء الأكواد والكتل البرمجية LTR دائماً */
        pre, code, pre *, code *, kbd, samp, .monaco-editor, .monaco-editor * {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: isolate !important;
        }

        /* تنسيق النصوص العربية */
        [dir="rtl"] {
          direction: rtl !important;
          text-align: right !important;
        }

        /* عزل الكلمات البرمجية المضمنة داخل النصوص العربية */
        [dir="rtl"] code:not(pre code) {
          direction: ltr !important;
          unicode-bidi: isolate !important;
          display: inline-block;
        }

        [dir="ltr"] {
          direction: ltr !important;
          text-align: left !important;
        }
      `;
      document.head.appendChild(s);
    }

    const elements = document.querySelectorAll(
      'p, li, h1, h2, h3, h4, h5, h6, blockquote, div[class*="message"], div[class*="content"], div[class*="bubble"]'
    );

    elements.forEach((el) => {
      if (
        el.closest('pre') ||
        el.closest('.monaco-editor') ||
        el.tagName === 'PRE' ||
        el.tagName === 'CODE'
      ) {
        return;
      }

      const text = el.innerText || '';
      const dir = determineDirection(text);
      if (dir && el.getAttribute('dir') !== dir) {
        el.setAttribute('dir', dir);
      }
    });
  };

  window.addEventListener('DOMContentLoaded', () => {
    applyBidi();
    const observer = new MutationObserver(() => applyBidi());
    observer.observe(document.body, { childList: true, subtree: true });
  });
} catch (e) {}
