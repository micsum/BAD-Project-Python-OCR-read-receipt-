// Buffer Line
let data;
const imagePath = JSON.parse(localStorage.getItem("imagepath"));
window.addEventListener("load", async () => {
  let viewImageDiv = document.querySelector("#viewImage");

  let element;
  element = document.createElement("img");
  element.setAttribute("id", "uploadedImage");
  element.setAttribute("src", imagePath);
  viewImageDiv.addEventListener("click", () => {
    Swal.fire({
      imageUrl: element.src,
      showCloseButton: true,
      showConfirmButton: false,
      imageWidth: 500,
    });
  });
  //viewImageDiv.appendChild(element);
});

//const data = [
//  [["香茅瀦頸肉", "撈檬"], ["$52.00"]],
//  [["2x 魚露雞扒撈", "檬"], ["$104.00"]],
//  [["1x 火車頭", "1x揣粉"], ["$70.00"]],
//  [["小計", "增值稅"], ["$226.00"]],
//  [["增值稅"], ["5.00"]],
//  [[""], ["-$56.50"]],
//  [["總計"], ["$174.50"]],
//];
let total = document.querySelector("#total")
let receiptBtn = document.querySelector("#receiptBtn");
receiptBtn.addEventListener("click", () => {
  if(total.value !== "" || total.value !== "undefined"){ Swal.fire({
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
        let subtotal = element.querySelector(".subtotal");
        if (!subtotal.disabled) {
          itemJson.push({
            item_name: itemName,
            quantity: quantity,
            price: unitPrice,
          });
        }
      });
      const res = await fetch("/insertReceiptItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemInfoList: itemJson }),
      });
      let result = await res.json();
      if (result.error){
        Swal.fire({
          icon: "error",
          title: "Fail to create receipt.",
        });
        return;
      }
      window.location.href = "./addPayerList.html";
      localStorage.removeItem("imagepath");
    },
  });}
  else {
    Swal.fire({
      icon:"error",
      title:"No information"
    })
  }
 
});
