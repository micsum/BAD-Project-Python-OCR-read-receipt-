//Buffer Line
const receipt = document.getElementById("receipt");
const claimedItems = document.getElementById("claimedItems");
const receiptItemTemplate = document.getElementById("receiptItem");
const confirmClaimButton = document.getElementById("confirmClaim");
const socket = io.connect();

let userID, userName, receiptHost;
let searchParams = new URLSearchParams(location.search);
let receiptID = searchParams.get("receiptID");

let receiptItemsInfo;
let claimedItemMap = new Map();

window.addEventListener("load", async function (event) {
  event.preventDefault();
  let res = await fetch("/getUserID", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ receiptID }),
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

  userID = result.userID;
  userName = result.userName;
  receiptHost = result.receiptHost;

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
  receiptItemsInfo = result.itemInfoList;
  let itemStringIDList = [];

  for (let item of receiptItemsInfo) {
    itemStringIDList.push(item.item_id);
  }

  res = await this.fetch("/getTempClaim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ itemStringIDList }),
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

  for (let claimedItem of result.userClaimRecord) {
    claimedItemMap.set(claimedItem.itemStringID, claimedItem.quantity);
  }

  for (let receiptItem of receiptItemsInfo) {
    if (claimedItemMap.get(receiptItem.item_id) === undefined) {
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
      document.getElementById(`setQuantity${receiptItem.item_id}`).value =
        receiptItem.quantity;
    }
  }

  if (receiptHost == userID) {
    let hostConfirmClaimButton = document.createElement("button");
    hostConfirmClaimButton.value = "Confirm All Receipt Claims";
    hostConfirmClaimButton.addEventListener("click", function () {
      Swal.fire({
        icon: "info",
        title: "Confirm All Claims ?",
        text: "Do you confirm that all claims made on this receipt are valid ?",
        showCancelButton: true,
        confirmButtonText: "Yes, I am 100% certain ",
        cancelButtonText: "No, I need to check again !",
        preConfirm: async () => {
          let res = await fetch(`/hostConfirmClaim/${receiptID}`, {
            method: "PUT",
          });
          let result = await res.json();
          if (result.error) {
            Swal.fire({
              icon: "error",
              title: result.error,
            });
            return;
          }
          window.location.href = "/homepage.html";
        },
      });
    });
    document.appendChild(hostConfirmClaimButton);
  }
  socket.join(receiptID);
});

confirmClaimButton.addEventListener("click", () => {
  let claimInfoItemList = [];
  for (let element of claimedItems) {
    let quantity = element.getElementById("quantity");
    let item_id = element.getAttribute("id").substring(4);
    for (let i = 0; i < quantity; i++) {
      claimInfoItemList.push({
        user_id: userID,
        item_id: item_id,
      });
    }
  }
  Swal.fire({
    icon: "info",
    title: "Confirm Claim?",
    preConfirm: async () => {
      let res = await fetch(`/claimReceiptItems/${receiptID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemList: claimItemInfoList }),
      });
      let result = res.json();
      if (result.error) {
        Swal.fire({
          icon: "error",
          title: result.error,
        });
      }
      socket.leave(receiptID);
      window.location.href = "./homepage.html";
    },
  });
});

socket.on("claimItem", () => {
  window.location.reload();
});
