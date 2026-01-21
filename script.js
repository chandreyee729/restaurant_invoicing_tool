const currency = "€";
let items = [];
let idCounter = 0;
let tipPercent = 0;
let extraAmount = 0;
let isDiscount = false;


// Initialize invoice
function initInvoice() {
  const now = new Date();
  document.getElementById("invoice-date").textContent =
    now.toLocaleDateString("de-DE");
  document.getElementById("invoice-number").textContent =
    "DK-" + now.getTime().toString().slice(-6);
}

// Format currency
function format(v) {
  return currency + v.toFixed(2);
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
  const tipAmount = (tipPercent / 100) * subtotal;
  const appliedExtra = isDiscount ? 0 : extraAmount;
  const grandTotal = subtotal + tipAmount + appliedExtra;

  // Update totals in HTML
  document.getElementById("total-net-food").textContent = format(totalNetFood);
  document.getElementById("total-tax-food").textContent = format(totalTaxFood);
  document.getElementById("total-net-drink").textContent = format(totalNetDrink);
  document.getElementById("total-tax-drink").textContent = format(totalTaxDrink);
  document.getElementById("total-net").textContent = format(totalNet);
  document.getElementById("total-tax").textContent = format(totalTax);
  document.getElementById("grand-total").textContent = format(grandTotal);
}

// Add a new item row
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
    <td><input type="number" value="0" class="net w-24"></td>
    <td class="tax text-center">7%</td>
    <td class="taxValue">€0.00</td>
    <td class="gross">€0.00</td>
    <td class="no-print"><button class="remove-btn text-red-500">✕</button></td>
  `;

  const [nameInput, typeSelect, qtyInput, netInput] = row.querySelectorAll("input, select");
  const taxCell = row.querySelector(".tax");
  const taxValueCell = row.querySelector(".taxValue");
  const grossCell = row.querySelector(".gross");

  // Update item and totals
  function update() {
    item.name = nameInput.value;
    item.qty = +qtyInput.value || 1;
    item.net = +netInput.value || 0;
    item.type = typeSelect.value;
    item.tax = taxRateByType(item.type);

    const taxAmount = item.qty * item.net * item.tax / 100;
    const gross = item.qty * item.net + taxAmount;

    taxCell.textContent = item.tax + "%";
    taxValueCell.textContent = format(taxAmount);
    grossCell.textContent = format(gross);

    recalc();
  }

  // Event listeners
  nameInput.addEventListener("input", update);
  qtyInput.addEventListener("input", update);
  netInput.addEventListener("input", update);
  typeSelect.addEventListener("change", update);

  // Remove button
  row.querySelector(".remove-btn").onclick = () => {
    items = items.filter(i => i.id !== item.id);
    row.remove();
    recalc();
  };

  document.getElementById("items-container").appendChild(row);
  update();
}

// Tip buttons
document.querySelectorAll(".tip-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    tipPercent = +btn.dataset.tip || 0;
    const tipInput = document.getElementById("tip-input");
    if (tipInput) tipInput.value = tipPercent;
    recalc();
  });
});

// Manual tip input
const tipInput = document.getElementById("tip-input");
if (tipInput) {
  tipInput.addEventListener("input", (e) => {
    tipPercent = parseFloat(e.target.value) || 0;
    recalc();
  });
}

// Additional Charges logic
const extraAmountInput = document.getElementById("extra-amount");
const extraDiscountCheckbox = document.getElementById("extra-discount");

if (extraAmountInput && extraDiscountCheckbox) {
  extraAmountInput.addEventListener("input", e => {
    extraAmount = parseFloat(e.target.value) || 0;
    recalc();
  });

  extraDiscountCheckbox.addEventListener("change", e => {
    isDiscount = e.target.checked;

    extraAmountInput.disabled = isDiscount;
    if (isDiscount) {
      extraAmount = 0;
      extraAmountInput.value = "";
    }

    recalc();
  });
}

// Buttons
document.getElementById("add-item-btn").onclick = addItem;
document.getElementById("clear-btn").onclick = () => {
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

  addItem();
  recalc();
};
document.getElementById("print-btn").onclick = () => window.print();

// Initialize
initInvoice();
addItem(); // start with one item
recalc();

