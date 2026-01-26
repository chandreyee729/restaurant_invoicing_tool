const translations = {
  en: {
    // Header
    title: "My Restaurant",
    subtitle: "Invoice Generator",

    // New invoice header titles
    receiverTitle: "Receiver",
    invoiceTitle: "Invoice",

    // Invoice meta labels
    invoiceNumberLabel: "Invoice No.",
    invoiceDateLabel: "Invoice Date",
    serviceDateLabel: "Service Date",
    reasonLabel: "Reason",

    // Table headings
    item: "Item",
    type: "Type",
    qty: "Qty",
    netUnit: "Net Unit Price (€)",
    tax: "Tax %",
    taxAmount: "Tax (€)",
    gross: "Gross Price (€)",

    // Buttons / Sections
    addItem: "+ Add Item",
    additionalCharges: "Additional Charges",
    discount: "Discount",
    extraHint: "This amount is automatically added to Grand Total",

    tipOptional: "Tip (Optional)",
    clear: "Clear",
    print: "Print / PDF",

    noAdditionalCharges: "No Additional Charges",
    chargeDescription: "Charge Description",
    chargeAmount: "Amount (€)",

    // Totals
    food: "Food",
    drinks: "Drinks",
    totals: "Total",
    net: "Net",
    grandTotal: "Grand Total",
    grandTotalNote: "(Total Net + Tax + Tips + Additional Charges)",

    // Notes and Transfer Details
    noteLabel: "Note",
    notePlaceholder: "Please transfer the invoice amount within 7 days without deductions to the account specified",

    transferDetailsLabel: "Transfer Details",
    transferDetailsPlaceholder: "Bank, IBAN, BIC, payment terms",

    senderTaxInfoLabel: "Sender Tax Information",
    senderTaxInfoPlaceholder: "VAT ID, tax number, registration details",

    verifyNote: "⚠ Please verify invoice number before generating PDF.",

  },

  de: {
    // Header
    title: "Mein Restaurant",
    subtitle: "Rechnungsgenerator",

    // New invoice header titles
    receiverTitle: "Empfänger",
    invoiceTitle: "Rechnung",

    // Invoice meta labels
    invoiceNumberLabel: "Rechnung - Nr.",
    invoiceDateLabel: "Rechnungsdatum",
    serviceDateLabel: "Leistungsdatum",
    reasonLabel: "Anlass",

    // Table headings
    item: "Artikel",
    type: "Typ",
    qty: "Menge",
    netUnit: "Netto Stückpreis (€)",
    tax: "MwSt. %",
    taxAmount: "MwSt. (€)",
    gross: "Bruttopreis (€)",

    // Buttons / Sections
    addItem: "+ Artikel hinzufügen",
    additionalCharges: "Zusätzliche Kosten",
    discount: "Rabatt",
    extraHint: "Dieser Betrag wird automatisch zur Gesamtsumme addiert",

    tipOptional: "Trinkgeld (Optional)",
    clear: "Zurücksetzen",
    print: "Drucken / PDF",

    noAdditionalCharges: "Keine Zusatzkosten",
    chargeDescription: "Beschreibung",
    chargeAmount: "Betrag (€)",

    // Totals
    food: "Essen",
    drinks: "Getränke",
    totals: "Gesamt",
    net: "Netto",
    grandTotal: "Gesamtsumme",
    grandTotalNote: "(Gesamt Netto + MwSt. + Trinkgeld + Zusatzkosten)",

    // Notes and Transfer Details
    noteLabel: "Hinweis",
    notePlaceholder: "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen ohne Abzug auf das angegebene Konto",

    transferDetailsLabel: "Zahlungsdetails",
    transferDetailsPlaceholder: "Bank, IBAN, BIC, Zahlungsfrist",

    senderTaxInfoLabel: "Steuerangaben des Absenders",
    senderTaxInfoPlaceholder: "USt-IdNr., Steuernummer, Handelsregister",

    // Footer Note
    verifyNote: "⚠ Bitte Rechnungsnummer prüfen, bevor Sie ein PDF erzeugen.",
  },
};

/**
 * Translate text nodes and placeholders using data-i18n / data-i18n-placeholder attributes
 */
function applyTranslations(lang) {
  // TEXT translations: data-i18n
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // PLACEHOLDER translations: data-i18n-placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute("placeholder", translations[lang][key]);
    }
  });
}

/**
 * Language switch handler
 */
function setLanguage(lang) {
  localStorage.setItem("invoice_lang", lang);
  applyTranslations(lang);
}

/**
 * Default language on load
 */
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("invoice_lang") || "en";
  applyTranslations(savedLang);

  // Also sync dropdown if present
  const selector = document.querySelector("select[onchange*='setLanguage']");
  if (selector) selector.value = savedLang;
});
