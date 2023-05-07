//Buffer Line
const socket = io.connect();

const receipt = document.getElementById("receipt");
const claimedItems = document.getElementById("claimedItems");
const receiptItemTemplate = document.getElementById("receiptItem");

let userID, userName;
let searchParams = new URLSearchParams(location.search);
let receiptID = searchParams.get("receiptID");

let receiptItemsInfo;
let claimedItemMap = new Map();

window.addEventListener("load", async function (event) {
  event.preventDefault();
  let res = await fetch("/getID", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: { receiptID },
  });
  let result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      title: "An error occurred",
      text: result.error,
    });
    return;
  }

  res = await fetch(`/getReceiptItems/${receiptID}`);
  result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      title: "An error occurred",
      text: result.error,
    });
    return;
  }
  receiptItemsInfo = result;
  let itemStringIDList = [];

  for (let item of receiptItemsInfo) {
    itemStringIDList.push(item.item_id);
  }

  res = await this.fetch("/getTempClaim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: itemStringIDList,
  });
  result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      title: "An error occurred",
      text: result.error,
    });
    return;
  }

  for (let claimedItem of result) {
    claimedItemMap.set(claimedItem.itemStringID, claimedItem.quantity);
  }

  for (let receiptItem of receiptItemsInfo) {
    if (claimedItemMap.get(receiptItem.item_id) !== undefined) {
      createItem(
        receiptItem,
        {
          intendedLocation: receipt,
          newLocation: claimedItems,
        },
        receiptItemTemplate,
        receiptItem.claimerList,
        true
      );
    } else {
      createItem(
        receiptItem,
        {
          intendedLocation: claimedItems,
          newLocation: receipt,
        },
        receiptItemTemplate,
        receiptItem.claimerList,
        false
      );
      document.getElementById(`setQuantity${itemID}`).value =
        receiptItem.quantity;
    }
  }
});

/*
socket.on("claimItem", ({ claimItemsInfo }) => {
  let claimUserID = claimItemsInfo[0].user_id;

  for(let )
});
*/
