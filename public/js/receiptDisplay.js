//Buffer Line
const receipt = document.getElementById("receipt");
const claimedItems = document.getElementById("claimedItems");
const receiptItemTemplate = document.getElementById("receiptItem");
const confirmClaimButton = document.getElementById("confirmClaim");
const returnButton = document.getElementById("return");

let userID, userName, receiptHost;
let searchParams = new URLSearchParams(location.search);
let receiptStringID = searchParams.get("receiptID");

let receiptItemsInfo;
let claimedItemMap = new Map();

window.addEventListener("load", async function (event) {
  event.preventDefault();
  let res = await fetch("/getUserID", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ receiptStringID }),
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

  res = await fetch(`/getReceiptItems/${receiptStringID}`);
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
        false,
        claimedItemMap.get(receiptItem.item_id)
      );
      document.getElementById(
        `setQuantity${receiptItem.item_id}`
      ).selectedIndex = claimedItemMap.get(receiptItem.itemStringID);
    }
  }

  if (receiptHost == userID) {
    let hostConfirmClaimButton = document.createElement("button");
    hostConfirmClaimButton.textContent = "Confirm All Receipt Claims";
    hostConfirmClaimButton.addEventListener("click", function () {
      Swal.fire({
        icon: "info",
        title: "Confirm All Claims ?",
        text: "Do you confirm that all claims made on this receipt are valid ?",
        showCancelButton: true,
        confirmButtonText: "Yes, I am 100% certain ",
        cancelButtonText: "No, I need to check again !",
        preConfirm: async () => {
          let res = await fetch(`/hostConfirmClaim/${receiptStringID}`, {
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
    document.getElementById("footer").appendChild(hostConfirmClaimButton);
  }
  socket.emit("joinReceiptRoom", {
    userID: userID,
    receiptStringID: receiptStringID,
  });
});

confirmClaimButton.addEventListener("click", () => {
  let claimItemInfoList = [];
  let claimedItemDivs = claimedItems.querySelectorAll(".receiptItemDiv");
  claimedItemDivs.forEach((element) => {
    let item_id = element.getAttribute("id").substring(4);
    let quantity = element.querySelector(`#setQuantity${item_id}`).value;
    for (let i = 0; i < quantity; i++) {
      claimItemInfoList.push({
        user_id: userID,
        item_id: item_id,
      });
    }
  });

  Swal.fire({
    icon: "info",
    title: "Confirm Claim?",
    showCancelButton: true,
    preConfirm: async () => {
      let res = await fetch(`/claimReceiptItems/${receiptStringID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemList: claimItemInfoList }),
      });
      let result = await res.json();
      if (result.error) {
        Swal.fire({
          icon: "error",
          title: result.error,
        });
      }
      window.location.href = "./homepage.html";
    },
  });
});

returnButton.addEventListener("click", function () {
  socket.emit("leaveReceiptRoom", {
    userID: userID,
    roomName: receiptStringID,
  });
  window.location.href = "./homepage.html";
});

socket.on("claimItem", () => {
  window.location.reload();
});
