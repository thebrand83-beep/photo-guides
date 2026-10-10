// ===== קובץ הגדרות — ערוך כאן בלבד =====
window.SITE_CONFIG = {
  paypalEmail: "studioimage1983@gmail.com", // ← החלף בכתובת חשבון ה-PayPal שלך
  currency: "ILS",
  contactEmail: "YOUR_EMAIL@example.com",       // ← החלף במייל ליצירת קשר
  // כתובת טופס לקבלת ביקורות (למשל Formspree: https://formspree.io/f/XXXX). השאר ריק עד שתגדיר.
  reviewsEndpoint: "",
  bookingUrl: "https://studioimagebooking.base44.app",
  // example: true מציג תגית "דוגמה" קטנה. מחק את השורה כשהמדריך אמיתי.
  guides: [
    { id: "basics", example: true, image: "img/g1.jpg", level: "מתחילים",
      title: "יסודות הצילום", price: 99,
      short: "תיאור לדוגמה. החלף בתיאור קצר של המדריך.",
      description: "טקסט לדוגמה. כאן יופיע תיאור מלא של המדריך: למי הוא מתאים, מה לומדים בו ובאיזה פורמט הוא נמסר.",
      topics: ["נושא לדוגמה ראשון", "נושא לדוגמה שני", "נושא לדוגמה שלישי", "נושא לדוגמה רביעי"] },
    { id: "portrait", example: true, image: "img/g2.jpg", level: "בינוניים",
      title: "פורטרט באור טבעי", price: 149,
      short: "תיאור לדוגמה. החלף בתיאור קצר של המדריך.",
      description: "טקסט לדוגמה. החלף בתיאור המלא של המדריך.",
      topics: ["נושא לדוגמה ראשון", "נושא לדוגמה שני", "נושא לדוגמה שלישי"] },
    { id: "editing", example: true, image: "img/g3.jpg", level: "כל הרמות",
      title: "עריכה ועיבוד תמונה", price: 129,
      short: "תיאור לדוגמה. החלף בתיאור קצר של המדריך.",
      description: "טקסט לדוגמה. החלף בתיאור המלא של המדריך.",
      topics: ["נושא לדוגמה ראשון", "נושא לדוגמה שני", "נושא לדוגמה שלישי"] }
  ],
  // ביקורות מאושרות בלבד. guide = id של המדריך, rating = 1 עד 5.
  reviews: [
  ]
};
