// Buffer Line
const itemListDiv = document.getElementById("itemList");
const itemListTemplate = document.getElementById("itemListTemplate");
const totalInput = document.getElementById("total");
const discountInput = document.getElementById("discountValue");
const scannedDiscountText = document.getElementById("scannedDiscount");
const discountInputButton = document.getElementById("discountInput");
const addItemButton = document.getElementById("addItem");

function updateRowPriceInformation(
  quantityInput,
  subtotalInput,
  unitPriceInput
) {
  let quantity = parseFloat(quantityInput.value);
  let subtotal = parseFloat(subtotalInput.value);
  let unitPrice = subtotal / quantity;
  unitPriceInput.value = `${unitPrice.toFixed(2)}`;
  if (unitPriceInput.value == "NaN") {
    unitPriceInput.value = "";
  }
}

function updateUnitPrice() {
  let itemList = document.querySelectorAll(".itemDiv");
  itemList.forEach((item) => {
    item.querySelector(".unitPrice").value =
      item.querySelector(".subtotal").value /
      item.querySelector(".quantity").value;
  });
}

function updateTotalPrice() {
  let subtotalList = document.querySelectorAll(".subtotal");
  let total = 0;
  subtotalList.forEach((elem) => {
    if (!elem.disabled) {
      if (parseFloat(elem.value).toFixed(2) === "NaN") {
        total = total;
      } else {
        total += parseFloat(elem.value);
      }
    }
  });
  totalInput.value = parseFloat(total).toFixed(2);
  updateUnitPrice();
  updateDetectedDiscount();
}

function getMaxMinPrice() {
  let maxMin = [0, 0];
  let subtotalList = document.querySelectorAll(".subtotal");
  subtotalList.forEach((elem) => {
    if (!elem.disabled) {
      if (parseInt(elem.value) > maxMin[0]) {
        maxMin[0] = parseFloat(elem.value).toFixed(2);
      } else if (parseInt(elem.value) < maxMin[1]) {
        maxMin[1] = parseFloat(elem.value).toFixed(2);
      }
    }
  });
  return maxMin;
}

function getDiscountValue(max, min) {
  return 1 - (-min / max).toFixed(2);
}

function formatDiscountText(number) {
  let resultText;
  if (number >= 100) {
    resultText = "/";
  } else if (number % 10 == 0) {
    resultText = number / 10;
  } else {
    resultText = number;
  }
  resultText += "折";
  return resultText;
}

function updateDetectedDiscount() {
  let [newMax, newMin] = getMaxMinPrice();
  let newDiscount = getDiscountValue(newMax, newMin);
  scannedDiscountText.textContent = formatDiscountText(newDiscount);
}

function createItemRow(data = [[""], ["$0.00"]]) {
  let node = itemListTemplate.content.cloneNode(true);
  let itemDiv = node.querySelector(".itemDiv");
  let itemNameInput = node.querySelector(".itemName");
  let quantityInput = node.querySelector(".quantity");
  let unitPriceInput = node.querySelector(".unitPrice");
  let subtotalInput = node.querySelector(".subtotal");
  let deleteButton = node.querySelector(".delete");

  let id = Math.random().toString(36).slice(2).substring(0, 4);

  itemDiv.setAttribute("id", `item${id}`);

  let itemName = data[0].join();
  while (itemName.indexOf(",") != -1) {
    itemName = itemName.replace(",", " ");
  }
  itemNameInput.value = itemName;

  quantityInput.value = 1;
  subtotalInput.value = data[1][0].replace("$", "");
  unitPriceInput.value = subtotalInput.value;

  quantityInput.addEventListener("input", async () => {
    if (quantityInput.value < 0) {
      quantityInput.value = 1;
      Swal.fire({
        icon: "error",
        text: "Quantity Input must be at least 1 !",
      });
      return;
    } else if (quantityInput.value == 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });
      if (quantityInput.value == 0) {
        quantityInput.value = 1;
        Swal.fire({
          icon: "error",
          text: "Quantity Input must be at least 1 !",
        });
        return;
      }
    }
    updateRowPriceInformation(quantityInput, subtotalInput, unitPriceInput);
  });

  subtotalInput.addEventListener("input", () => {
    updateRowPriceInformation(quantityInput, subtotalInput, unitPriceInput);
    updateTotalPrice();
  });

  deleteButton.addEventListener("click", () => {
    if (deleteButton.value == "Delete") {
      subtotalInput.disabled = true;
      deleteButton.value = "Restore";
      //deleteButton.setAttribute(
      //  "class",
      //  "delete cursor-pointer text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 light:bg-yellow-600 light:hover:bg-yellow-700 light:focus:ring-yellow-900"
      //);
      deleteButton.innerHTML = `<i class="fa-solid fa-rotate-left fa-xl text-yellow-400 hover:text-yellow-600 rounded-full hover:bg-gray-100 p-1"></i> `;
    } else if (deleteButton.value == "Restore") {
      subtotalInput.disabled = false;
      deleteButton.value = "Delete";
      deleteButton.innerHTML = `<svg class="w-8 h-8 text-red-400 hover:text-red-600 rounded-full hover:bg-gray-100 p-1"
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
      </path>
  </svg>`;
    }
    updateTotalPrice();
  });

  itemListDiv.appendChild(node);
}

let max, min;
let receiptDiscount = -1;
let detectedDiscount = 100;

window.addEventListener("load", async (event) => {
  event.preventDefault();
  const res = await fetch("/loadReceiptItems", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      text: result.error,
    });
    return;
  }
  data = result.itemList;

  for (let i = 0; i < data.length; i++) {
    createItemRow(data[i]);

    if (receiptDiscount == -1) {
      [max, min] = getMaxMinPrice();
      let detectedDiscount = getDiscountValue(max, min) * 100;
      detectedDiscount > 100 ? 100 : detectedDiscount;
      scannedDiscountText.value = formatDiscountText(detectedDiscount);
    }
  }
  updateTotalPrice();
});

addItemButton.addEventListener("click", () => {
  createItemRow();
  updateTotalPrice();
});

discountInputButton.addEventListener("click", () => {
  if (
    discountInput.value != "" &&
    discountInput.value > 0 &&
    discountInput.value <= 100
  ) {
    let currentDiscount = detectedDiscount;
    let newDiscount = parseInt(discountInput.value);
    newDiscount = newDiscount < 10 ? (newDiscount *= 10) : newDiscount;

    let normalizedDiscount;
    if (newDiscount != detectedDiscount) {
      normalizedDiscount = newDiscount / currentDiscount;
      detectedDiscount = newDiscount;

      let subtotalList = document.querySelectorAll(".subtotal");
      subtotalList.forEach((elem) => {
        elem.value *= normalizedDiscount;
        elem.value = parseFloat(elem.value).toFixed(2);
      });
    } else {
      normalizedDiscount = currentDiscount / 100;
    }

    updateUnitPrice();
    updateTotalPrice();
  } else {
    Swal.fire({
      icon: "error",
      title: "Please Input an appropriate Discount",
    });
  }
});
