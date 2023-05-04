//Buffer Line
function getAvailableQuantity(quantity, claimedUserName) {
  let claimerList = claimedUserName.split(",");
  let claimedQuantity = claimerList.length;
  if (claimedQuantity == 1) {
    claimedQuantity = claimerList[0].length == 0 ? 0 : 1;
  }
  return quantity - claimedQuantity;
}

function createItem(itemInfo, htmlDiv, template, claimedUserName, claim) {
  let { quantity, itemName, itemID, price } = itemInfo;

  let node = template.content.cloneNode(true);
  let quantityDisplay = node.querySelector("#quantity");
  let claimButton = node.querySelector(".claimButton");
  let locationDiv = htmlDiv.intendedLocation;

  quantityDisplay.textContent = `${quantity}x`;
  node.querySelector("#price").textContent = `$${price}`;
  node.querySelector("#itemName").textContent = `${itemName}`;
  node.querySelector(".receiptItemDiv").setAttribute("id", `item${itemID}`);

  if (claim) {
    let claimUserText = document.createElement("span");
    let claimUserDiv = document.createElement("div");
    claimUserText.textContent = claimedUserName;
    claimUserText.setAttribute("id", `claimedUser${itemID}`);
    claimUserDiv.textContent = "Claimed by : ";
    claimUserDiv.appendChild(claimUserText);
    node.querySelector(".itemDiv").appendChild(claimUserDiv);
  }

  if (!claim) {
    let availableQuantity = getAvailableQuantity(quantity, claimedUserName);
    if (availableQuantity === 0) {
      return;
    }
    let quantitySelector = document.createElement("select");
    for (let i = 0; i < availableQuantity; i++) {
      let option = document.createElement("option");
      option.setAttribute("value", i);
      option.textContent = (i + 1).toString() + "x";
      quantitySelector.appendChild(option);
    }
    quantitySelector.addEventListener("select", function () {});

    quantityDisplay.innerHTML = "";
    quantityDisplay.appendChild(quantitySelector);
  }

  claimButton.textContent = claim ? "Claim" : "Unclaim";
  claimButton.addEventListener("click", async function (event) {
    event.preventDefault();
    if (claim) {
      let claimedUserName = document.getElementById(
        `claimedUser${itemID}`
      ).textContent;
      if (getAvailableQuantity(quantity, claimedUserName) === 0) {
        Swal.fire({
          icon: "error",
          title: "Item Over Claimed",
          text: "This item has already been claimed in full",
        });
        return;
      }
      /*
        let res = await fetch("/addTempClaim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemStringID: itemID,
            quantity: 1,
            user_id: userID,
          }),
        });
        */
      document.getElementById(`item${itemID}`).remove();
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
      document.getElementById(`item${itemID}`).remove();
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
    }
  });
  locationDiv.appendChild(node);
}

/*
type itemInfo = {
    quantity: number,
    itemName: string,
    itemID: string,
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
