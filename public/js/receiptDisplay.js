//Buffer Line
const receipt = document.getElementById("receipt");
const claimedItems = document.getElementById("claimedItems");
const receiptItemTemplate = document.getElementById("receiptItem");

let userID, userName;
let searchParams = new URLSearchParams(location.search);
let receiptID = searchParams.get("receiptID");
const socket = io.connect();

window.addEventListener("load", async function (event) {
  event.preventDefault();
  ({ userID, userName } = await fetch("/getID"));

  let res = await fetch(`/getReceiptItems/${receiptID}`);
  let result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      title: "An error occurred",
      text: result.error,
    });
    return;
  }
});
