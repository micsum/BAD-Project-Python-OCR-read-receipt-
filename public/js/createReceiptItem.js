//Buffer Line
function getAvailableQuantity(quantity, claimedUserName) {
  let claimerList = claimedUserName.split(",");
  let claimedQuantity = claimerList.length;
  claimedQuantity = claimerList[0] === "" ? 0 : 1;
  let userCount = 0;
  for (let i = 0; i < claimerList.length; i++) {
    let elem = claimerList[i];
    if (elem.substring(0, elem.length - 4) == userName) {
      userCount = parseInt(elem.substring(elem.length - 2, elem.length - 1));
    }
  }

  if (userCount == 0) {
    return quantity - claimedQuantity;
  } else {
    return userCount;
  }
}

function formatClaimedUserNameList(claimedUserName) {
  let nameList = claimedUserName.split(",");
  nameList = nameList.map((elem) => {
    return elem.trim();
  });

  if (nameList[0] == "") {
    return "";
  }

  let userNameList = [];
  let userNameAppearance = {};
  for (let userName of nameList) {
    if (userNameAppearance[userName] == undefined) {
      userNameAppearance[userName] = 1;
      userNameList.push(userName);
    } else {
      userNameAppearance[userName]++;
    }
  }

  let finalString = "";
  for (let name of userNameList) {
    finalString += `${name} x${userNameAppearance[name]} `;
  }

  return finalString;
}

function createItem(
  itemInfo,
  htmlDiv,
  template,
  claimedUserName,
  claim,
  claimedAmount = 0
) {
  let { quantity, item_name, item_id, price } = itemInfo;

  let node = template.content.cloneNode(true);
  let quantityDisplay = node.querySelector("#quantity");
  let claimButton = node.querySelector(".claimButton");
  let locationDiv = htmlDiv.intendedLocation;

  quantityDisplay.textContent = `${quantity}x`;
  node.querySelector("#price").textContent = `$${price}`;
  node.querySelector("#itemName").textContent = `${item_name}`;
  node.querySelector(".receiptItemDiv").setAttribute("id", `item${item_id}`);

  if (claim) {
    let claimUserText = document.createElement("span");
    let claimUserDiv = document.createElement("div");
    claimedUserName = formatClaimedUserNameList(claimedUserName);
    claimUserText.textContent = claimedUserName;
    claimUserText.setAttribute("id", `claimedUser${item_id}`);
    claimUserDiv.textContent = "Claimed by : ";
    claimUserDiv.appendChild(claimUserText);
    node.querySelector(".itemDiv").appendChild(claimUserDiv);
  }
  if (!claim) {
    let expectedQuantity;
    if (claimedAmount == 0) {
      let availableQuantity = getAvailableQuantity(quantity, claimedUserName);
      if (availableQuantity === 0) {
        Swal.fire({
          icon: "error",
          title: "Item claimed in full",
        });
        return;
      }
      expectedQuantity = availableQuantity;
    } else {
      expectedQuantity = claimedAmount;
    }

    let quantitySelector = document.createElement("select");
    quantitySelector.setAttribute("id", `setQuantity${item_id}`);
    for (let i = 1; i <= quantity; i++) {
      let option = document.createElement("option");
      option.setAttribute("value", i);
      option.textContent = i.toString() + "x";
      quantitySelector.appendChild(option);
    }
    quantitySelector.addEventListener("select", async function (event) {
      event.preventDefault();
      let res = await fetch("/updateItemQuantity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      let result = await res.json();
      if (result.error) {
        return;
      }
    });
    quantityDisplay.innerHTML = "";
    quantityDisplay.appendChild(quantitySelector);
  }

  claimButton.textContent = claim ? "Claim" : "Unclaim";
  claimButton.addEventListener("click", async function (event) {
    event.preventDefault();
    if (claim) {
      let claimedUserName = document.getElementById(
        `claimedUser${item_id}`
      ).textContent;
      if (getAvailableQuantity(quantity, claimedUserName) == 0) {
        Swal.fire({
          icon: "error",
          title: "Item Over Claimed",
          text: "This item has already been claimed in full",
        });
        return;
      }
      let res = await fetch("/addTempClaim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemStringID: item_id,
          quantity: 1,
          user_id: userID,
        }),
      });
      let result = res.json();
      if (result.error) {
        Swal.fire({
          icon: "error",
          title: result.error,
        });
        return;
      }
      document.getElementById(`item${item_id}`).remove();
      createItem(
        itemInfo,
        {
          intendedLocation: htmlDiv.newLocation,
          newLocation: htmlDiv.intendedLocation,
        },
        template,
        claimedUserName,
        false
      );
    } else {
      let res = await fetch("/removeTempClaim", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemStringID: item_id, user_id: userID }),
      });
      let result = res.json();
      if (result.error) {
        return;
      }
      document.getElementById(`item${item_id}`).remove();
      createItem(
        itemInfo,
        {
          intendedLocation: htmlDiv.newLocation,
          newLocation: htmlDiv.intendedLocation,
        },
        template,
        claimedUserName,
        true
      );
      window.location.reload();
    }
  });
  if (userID == receiptHost) {
    let resetClaimButton = document.createElement("button");
    resetClaimButton.textContent = "Reset Claims";
    resetClaimButton.addEventListener("click", function () {
      Swal.fire({
        icon: "info",
        title: "Reset Claims ?",
        text: "Do you wish to reset the claims of this item ? ",
        showCancelButton: true,
        confirmButtonText: "Yes, I am 100% certain ",
        cancelButtonText: "No, I mis-clicked !",
        preConfirm: async () => {
          let res = await fetch(`/resetReceiptItemClaim/${receiptStringID}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              itemID: itemInfo.id,
              itemStringID: item_id,
            }),
          });
          let result = await res.json();
          if (result.error) {
            Swal.fire({
              icon: "error",
              title: result.error,
            });
          } else {
            Swal.fire({
              icon: "success",
              title: "Item Claims Successfully Reset",
            });
            window.location.reload();
          }
        },
      });
    });
    node.querySelector(".controlsDiv").appendChild(resetClaimButton);
  }
  locationDiv.appendChild(node);
}

/*
type itemInfo = {
    quantity: number,
    itemName: string,
    item_id: string,
    price: decimal,
}

htmlDiv: {
  intendedLocation: current position to add the item
  newLocation: new Location to add the item
}

template: html template
claimedUserName: string
claim : Boolean for whether the function is for claiming or removing
*/
