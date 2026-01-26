let currentLang = "en"; // default language
let items = [];
let idCounter = 0;
let tipPercent = null;
let extraAmount = 0;
let isDiscount = false;

const languageSwitch = document.getElementById("language-switch");

if (languageSwitch) {
  languageSwitch.addEventListener("change", e => {
    currentLang = e.target.value;
    applyLanguage(currentLang);
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
      totalNetFood += i.qty * i.net;
      totalTaxFood += taxAmount;
    } else {
      totalNetDrink += i.qty * i.net;
      totalTaxDrink += taxAmount;
    }
  });
  const totalNet = totalNetFood + totalNetDrink;
  const totalTax = totalTaxFood + totalTaxDrink;
  const subtotal = totalNet + totalTax;

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
const grandTotal = subtotal + tipAmount + appliedExtra;

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
    tax: 7
  };
  items.push(item);

  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input placeholder="Item Name" class="item-name"></td>
    <td>
      <select class="item-type">
        <option value="food">Food</option>
        <option value="drink">Drink</option>
      </select>
    </td>
    <td><input type="number" value="1" class="qty w-16"></td>
    <td><input type="number" value="0.00" class="net w-24"></td>
    <td class="tax text-center">7%</td>
    <td class="taxValue">€0.00</td>
    <td class="gross">€0.00</td>
    <td class="no-print"><button class="remove-btn text-red-500">✕</button></td>
  `;

  const [nameInput, typeSelect, qtyInput, netInput] = row.querySelectorAll("input, select");
  const taxCell = row.querySelector(".tax");
  const taxValueCell = row.querySelector(".taxValue");
  const grossCell = row.querySelector(".gross");
  const grossInput = row.querySelector(".gross");


  // Update item and totals
  function grossFromNet() {
    item.name = nameInput.value;
    item.qty = +qtyInput.value || 1;
    item.net = +netInput.value || 0;
    item.type = typeSelect.value;
    item.tax = taxRateByType(item.type);

    const taxAmount = item.qty * item.net * item.tax / 100;
    const gross = item.qty * item.net + taxAmount;

    taxCell.textContent = item.tax + "%";
    taxValueCell.textContent = formatCurrency(taxAmount);
    grossCell.textContent = formatCurrency(gross);
    recalc();
  }

  // Event listeners
  nameInput.addEventListener("input", grossFromNet);
  qtyInput.addEventListener("input", grossFromNet);
  netInput.addEventListener("input", grossFromNet);
  typeSelect.addEventListener("change", grossFromNet);

  // Remove button
  row.querySelector(".remove-btn").onclick = () => {
    items = items.filter(i => i.id !== item.id);
    row.remove();
    recalc();
  };
  document.getElementById("items-container").appendChild(row);
  grossFromNet();
}

// Tip buttons
document.querySelectorAll(".tip-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // set percentage
    tipPercent = +btn.dataset.tip || 0;

    // clear manual input
    const tipInput = document.getElementById("tip-input");
    if (tipInput) tipInput.value = "";

    // highlight active button
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

  // ---- Print visibility helpers ----
  updateAdditionalChargesForPrint();
  updateDiscountVisibilityForPrint();

  // ---- Initial calculation ----
  recalc();
});


