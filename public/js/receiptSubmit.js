// Buffer Line
const imagePath = JSON.parse(localStorage.getItem("imagepath"));
window.addEventListener("load", async () => {
  let viewImageDiv = document.querySelector("#viewImage");

  let element;
  element = document.createElement("img");
  element.setAttribute("id", "uploadedImage");
  element.setAttribute("src", imagePath);
  element.addEventListener("click", () => {
    Swal.fire({
      imageUrl: element.src,
      showCloseButton: true,
      showConfirmButton: false,
      imageWidth: 500,
    });
  });
  viewImageDiv.appendChild(element);
});

//const data = JSON.parse(localStorage.getItem("itemData")); using localstorage

//const res = await fetch("/loadReceiptItems",{
// method:"GET",
// headers:{"Content-Type": "application/json"}
//})
//
//const result = await res.json();
//const itemList = result.itemList
//const data = itemList
const data = [
  [["香茅瀦頸肉", "撈檬"], ["$52.00"]],
  [["2x 魚露雞扒撈", "檬"], ["$104.00"]],
  [["1x 火車頭", "1x揣粉"], ["$70.00"]],
  [["小計", "增值稅"], ["$226.00"]],
  [["增值稅"], ["5.00"]],
  [[""], ["-$56.50"]],
  [["總計"], ["$174.50"]],
];

let receiptBtn = document.querySelector("#receiptBtn");
receiptBtn.addEventListener("click", () => {
  Swal.fire({
    title: "Confirm to create receipt?",
    icon: "question",
    confirmButtonText: "Confirm",
    showCancelButton: true,
    showConfirmButton: true,
    showCloseButton: true,
    confirmButtonColor: "#14d7b0",
    preConfirm: async () => {
      let itemDiv = document.querySelectorAll(".itemDiv");
      let itemJson = [];
      itemDiv.forEach((element) => {
        let itemName = element.querySelector(".itemName").value;
        let quantity = element.querySelector(".quantity").value;
        let unitPrice = element.querySelector(".unitPrice").value;
        itemJson.push({
          item_name: itemName,
          quantity: quantity,
          price: unitPrice,
        });
      });
      const res = await fetch("/insertReceiptItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemInfoList: itemJson }),
      });
      let result = await res.json();
      if (result.error) {
        Swal.fire({
          icon: "error",
          title: "Fail to create receipt.",
        });
        return;
      }
      window.location.href = "./addPeopleList.html";
      localStorage.removeItem("imagepath");
    },
  });
});
