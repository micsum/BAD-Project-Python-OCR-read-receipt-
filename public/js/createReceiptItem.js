//Buffer Line

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

  if (!claim && quantity > 1) {
    let quantitySelector = document.createElement("select");
    for (let i = 0; i < quantity; i++) {
      let option = document.createElement("option");
      option.setAttribute("value", i);
      option.textContent = (i + 1).toString() + "x";
      quantitySelector.appendChild(option);
    }
    quantityDisplay.innerHTML = "";
    quantityDisplay.appendChild(quantitySelector);
  }

  claimButton.textContent = claim ? "Claim" : "Unclaim";
  claimButton.addEventListener("click", function () {
    document.getElementById(`item${itemID}`).remove();
    if (claim) {
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
