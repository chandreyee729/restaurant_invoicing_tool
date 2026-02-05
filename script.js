//let currentLang = "en"; // default language
let items = [];
let idCounter = 0;
let tipPercent = null;
let extraAmount = 0;
let isDiscount = false;

applyTranslations(document);
const languageSwitch = document.getElementById("language-switch");

if (languageSwitch) {
  languageSwitch.addEventListener("change", e => {
    currentLang = e.target.value;
    localStorage.setItem("invoice_lang", currentLang);
    document.documentElement.lang = currentLang;

    applyTranslations(document);
    recalc();
  });
}
// Initialize function for invoice date and number
function initInvoice() {
  const now = new Date();
  document.getElementById("invoice-date-input").placeholder =
    now.toLocaleDateString("de-DE");
  document.getElementById("invoice-number-input").textContent =
    "DK-" + now.getTime().toString().slice(-6);
}

// Format currency
function formatCurrency(value) {
  const locale = currentLang === "de" ? "de-DE" : "en-GB";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

// Determine tax by item type
function taxRateByType(type) {
  return type === "drink" ? 19 : 7;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

// Recalculate totals
function recalc() {
  let totalNetFood = 0;
  let totalTaxFood = 0;
  let totalNetDrink = 0;
  let totalTaxDrink = 0;

  // Calculate Net, Tax, Gross per item
  items.forEach(i => {
    const taxAmount = i.qty * i.net * i.tax / 100;
    const gross = i.qty * i.net + taxAmount;

    if (i.type === "food") {
      totalNetFood += round2(i.qty * i.net);
      totalTaxFood += taxAmount;
    } else {
      totalNetDrink += round2(i.qty * i.net);
      totalTaxDrink += taxAmount;
    }
  });
  const totalNet = round2(totalNetFood + totalNetDrink);
  const totalTax = round2(totalTaxFood + totalTaxDrink);
  const subtotal = round2(totalNet + totalTax);

  // TIP calculation
  let tipAmount = 0;
  const manualTip = parseFloat(tipInput?.value);

  if (!isNaN(manualTip)) {
    tipAmount = manualTip;
  } else if (tipPercent !== null) {
    tipAmount = (tipPercent / 100) * subtotal;
  }

  // Update tip display
  const tipAmountEl = document.getElementById("tip-amount-display");
  if (tipAmountEl) {
    tipAmountEl.textContent = formatCurrency(tipAmount);
  }     

  const appliedExtra = isDiscount ? 0 : extraAmount;
  const grandTotal = round2(subtotal + tipAmount + appliedExtra);

  // Update totals in HTML
  document.getElementById("total-net-food").textContent = formatCurrency(totalNetFood);
  document.getElementById("total-tax-food").textContent = formatCurrency(totalTaxFood);
  document.getElementById("total-net-drink").textContent = formatCurrency(totalNetDrink);
  document.getElementById("total-tax-drink").textContent = formatCurrency(totalTaxDrink);
  document.getElementById("total-net").textContent = formatCurrency(totalNet);
  document.getElementById("total-tax").textContent = formatCurrency(totalTax);
  document.getElementById("grand-total").textContent = formatCurrency(grandTotal);
}

// Add a new item row to the invoice
function addItem() {
  const item = {
    id: ++idCounter,
    name: "",
    qty: 1,
    net: 0,
    type: "food",
    tax: 7,
    priceMode: "net" // net | gross
  };
  items.push(item);

  const row = document.createElement("tr");

  // NOTE:
  // - Net has an input always present (but may be disabled/hidden depending on mode)
  // - Gross column contains BOTH: a text output span + a hidden input for gross entry
  row.innerHTML = `
    <td class="item-cell">
  <input placeholder="Item Name" data-i18n-placeholder="itemNamePlaceholder" class="item-name auto-expand-input print-source">
   <span class="item-print print-target hidden"></span>
</td>
    <td>
      <select class="item-type">
        <option data-i18n="selectFood" value="food">Food</option>
        <option data-i18n="selectDrink" value="drink">Drink</option>
      </select>
    </td>

      </select>
    </td>

    <td><input type="number" value="1" min="1" class="qty w-16"></td>

    <td class="no-print">
      <select class="price-mode text-xs border rounded px-2 py-1">
        <option data-i18n-placeholder="selectNet" value="net">Net</option>
        <option data-i18n-placeholder="selectGross" value="gross">Gross</option>
      </select>
    </td>

    <!-- Net Unit Price -->
    <td>
      <input type="number" value="0.00" min="0" step="0.001" class="net-input w-24 print-source">
        <span class="net-print print-target hidden"></span>
    </td>

    <td class="tax text-center">7%</td>
    <td class="taxValue">€0.00</td>

    <!-- Gross Price -->
    <td class="gross-cell">
      <span class="gross-text">€0.00</span>
      <input type="number" value="0.00" min="0" step="0.001" class="gross-input w-24 hidden print-source">
        <span class="gross-print print-target hidden"></span>
    </td>

    <td class="no-print">
      <button type="button" class="remove-btn text-red-500">✕</button>
    </td>
  `;

  // Safer selectors (no destructuring)
  const nameInput = row.querySelector(".item-name");
  const typeSelect = row.querySelector(".item-type");
  const qtyInput = row.querySelector(".qty");
  const priceModeSelect = row.querySelector(".price-mode");

  const netInput = row.querySelector(".net-input");

  const taxCell = row.querySelector(".tax");
  const taxValueCell = row.querySelector(".taxValue");

  const grossText = row.querySelector(".gross-text");
  const grossInput = row.querySelector(".gross-input");

  function syncPriceModeUI() {
    const mode = priceModeSelect.value;

    if (mode === "gross") {
      // gross is editable, net is derived
      grossInput.classList.remove("hidden");
      grossText.classList.add("hidden");

      netInput.disabled = true;
      netInput.classList.add("opacity-60");
    } else {
      // net is editable, gross is derived
      grossInput.classList.add("hidden");
      grossText.classList.remove("hidden");

      netInput.disabled = false;
      netInput.classList.remove("opacity-60");
    }
  }

  // Update item and recalc totals 
  function update() {
    item.name = nameInput.value;
    item.qty = +qtyInput.value || 1;

    item.type = typeSelect.value;
    item.tax = taxRateByType(item.type);

    item.priceMode = priceModeSelect.value;

    const taxRate = item.tax / 100;

    // Ensure UI matches mode (so gross input actually appears)
    syncPriceModeUI();

    let netUnit = 0;
    let grossUnit = 0;

    if (item.priceMode === "gross") {
      // USER enters GROSS UNIT
      grossUnit = +grossInput.value || 0;

      // derive NET UNIT
      netUnit = grossUnit / (1 + taxRate);

      // sync net unit display (read-only)
      netInput.value = netUnit.toFixed(3);
      item.net = netUnit;
    } else {
      // USER enters NET UNIT
      netUnit = +netInput.value || 0;
      item.net = netUnit;

      // derive GROSS UNIT
      grossUnit = netUnit * (1 + taxRate);

      // keep gross unit display in sync
      grossInput.value = grossUnit.toFixed(2);
    }

    const taxAmount = netUnit * item.qty * taxRate;
    const grossTotal = grossUnit * item.qty;

    taxCell.textContent = item.tax + "%";
    taxValueCell.textContent = formatCurrency(taxAmount);
    grossText.textContent = formatCurrency(grossTotal);

    recalc();
  }

  // Events
  nameInput.addEventListener("input", update);
  qtyInput.addEventListener("input", update);

  typeSelect.addEventListener("change", update);

  priceModeSelect.addEventListener("change", () => {
    // when switching modes, keep values consistent and then recalc
    update();
  });

  netInput.addEventListener("input", update);
  grossInput.addEventListener("input", update);

  row.querySelector(".remove-btn").onclick = () => {
    items = items.filter(i => i.id !== item.id);
    row.remove();
    recalc();
  };

  document.getElementById("items-container").appendChild(row);
  if (window.applyTranslations) {
    window.applyTranslations(row);
  }
  // Initialize UI + totals
  syncPriceModeUI();
  update();
}

// Tip buttons 
document.querySelectorAll(".tip-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // set percentage
    tipPercent = +btn.dataset.tip || 0;

    // clear manual input
    const tipInput = document.getElementById("tip-input");
    if (tipInput) tipInput.value = "";

    // remove highlight active button and set current
    document.querySelectorAll(".tip-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    recalc();
  });
});

// Manual tip input
const tipInput = document.getElementById("tip-input");
if (tipInput) {
  tipInput.addEventListener("input", (e) => {
    // manual tip overrides %
    tipPercent = null;

    // remove button highlight
    document.querySelectorAll(".tip-btn")
      .forEach(b => b.classList.remove("active"));

    recalc();
  });
}
// No Tip button Listener
document.addEventListener("DOMContentLoaded", () => {
  const noTipBtn = document.getElementById("no-tip-btn");
  if (!noTipBtn) return;

  noTipBtn.addEventListener("click", () => {
    tipPercent = 0;

    const tipInput = document.getElementById("tip-input");
    if (tipInput) tipInput.value = "";

    document.querySelectorAll(".tip-btn").forEach(b => b.classList.remove("tip-btn-active"));
    noTipBtn.classList.add("tip-btn-active");

    recalc();
  });
});
// Additional Charges logic
const extraAmountInput = document.getElementById("extra-amount");
const extraDiscountCheckbox = document.getElementById("extra-discount");

if (extraAmountInput && extraDiscountCheckbox) {

  // Amount input
  extraAmountInput.addEventListener("input", e => {
    extraAmount = parseFloat(e.target.value);
    if (isNaN(extraAmount) || extraAmount < 0) {
      extraAmount = 0;
    }
    recalc();
  });

  // Discount checkbox
  extraDiscountCheckbox.addEventListener("change", e => {
    isDiscount = e.target.checked;

    if (isDiscount) {
      // Disable & reset amount when discount is checked
      extraAmount = 0;
      extraAmountInput.value = "";
      extraAmountInput.disabled = true;
    } else {
      // Re-enable amount input
      extraAmountInput.disabled = false;
    }

    recalc();
  });
}
// Sync net input values to print spans before print
window.addEventListener("beforeprint", syncPrintValues);
function syncPrintValues() {
  document.querySelectorAll(".net-input").forEach(input => {
    const printSpan = input.closest("td").querySelector(".net-print");
    if (!printSpan) return;

    const value = parseFloat(input.value);
    printSpan.textContent = isNaN(value)
      ? ""
      : value.toFixed(2).replace(".", ",") + " €";
  });
}


// Update visibility of Additional Charges row for print
function updateAdditionalChargesForPrint() {
  const descEl = document.getElementById("extra-desc");
  const amountEl = document.getElementById("extra-amount");
  const discountEl = document.getElementById("extra-discount");

  const sectionEl = document.getElementById("additional-charges-section");
  const fieldsRow = document.getElementById("additional-charges-fields");

  if (!descEl || !amountEl || !discountEl || !sectionEl || !fieldsRow) return;

  const isBlank =
    !descEl.value.trim() &&
    !amountEl.value.trim() &&
    !discountEl.checked;

  // Always keep visible on screen (print-hidden does nothing on screen if CSS is correct)
  if (isBlank) {
    sectionEl.classList.add("print-hidden"); // hide entire section in PDF
  } else {
    sectionEl.classList.remove("print-hidden");
  }
}

// Event listeners for updating Additional Charges visibility
const descEl = document.getElementById("extra-desc");
const amountEl = document.getElementById("extra-amount");
const discountEl = document.getElementById("extra-discount");

if (descEl) descEl.addEventListener("input", updateAdditionalChargesForPrint);
if (amountEl) amountEl.addEventListener("input", updateAdditionalChargesForPrint);
if (discountEl) discountEl.addEventListener("change", updateAdditionalChargesForPrint);

// Update visibility of Discount in Additional Charges for print
function updateDiscountVisibilityForPrint() {
  const descEl = document.getElementById("extra-desc");
  const discountCheckbox = document.getElementById("extra-discount");
  const discountWrapper = document.getElementById("discount-print-wrapper");

  if (!descEl || !discountCheckbox || !discountWrapper) return;
  const hasDescription = descEl.value.trim().length > 0;
  const isDiscountChecked = discountCheckbox.checked;


  // Print rule:
  // If description exists AND discount is NOT checked → hide discount in PDF
  if (hasDescription && !isDiscountChecked) {
    discountWrapper.classList.add("print-hidden");
  } else {
    discountWrapper.classList.remove("print-hidden");
  }
}
// Event listeners for updating Discount visibility
document.addEventListener("DOMContentLoaded", updateDiscountVisibilityForPrint);
window.addEventListener("beforeprint", updateDiscountVisibilityForPrint);

if (descEl) descEl.addEventListener("input", updateDiscountVisibilityForPrint);
if (discountEl) discountEl.addEventListener("change", updateDiscountVisibilityForPrint);

// Initialize the app on DOM load
document.addEventListener("DOMContentLoaded", () => {


  // ---- Invoice meta ----
  initInvoice();

  // ---- Buttons ----
  const addItemBtn = document.getElementById("add-item-btn");
  const clearBtn = document.getElementById("clear-btn");
  const printBtn = document.getElementById("print-btn");

  if (addItemBtn) {
    addItemBtn.type = "button"; // prevent form submit
    addItemBtn.addEventListener("click", addItem);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      items = [];
      tipPercent = 0;
      extraAmount = 0;
      isDiscount = false;

      document.getElementById("items-container").innerHTML = "";

      const tipInput = document.getElementById("tip-input");
      if (tipInput) tipInput.value = "";

      const extraInput = document.getElementById("extra-amount");
      if (extraInput) extraInput.value = "";

      const discountBox = document.getElementById("extra-discount");
      if (discountBox) discountBox.checked = false;

      recalc();
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }
  
  // ---- Trim reason input before print ----
  window.addEventListener("beforeprint", () => {
    const input = document.getElementById("reason-input");
    const print = document.getElementById("reason-print");

    if (input && print) {
      print.textContent = input.value;
    }
  });
 // ---- Sync item names for print ----
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll(".item-cell").forEach(cell => {
      const input = cell.querySelector("input");
      const print = cell.querySelector(".item-print");
      if (input && print) {
        print.textContent = input.value || "";
      }
    });
  });

  // ---- Print visibility helpers ----
  updateAdditionalChargesForPrint();
  updateDiscountVisibilityForPrint();

  // ---- Initial calculation ----
  recalc();
});


