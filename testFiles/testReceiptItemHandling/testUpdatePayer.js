let receiptItems = [
  {
    id: 1,
    item_name: "bread",
    price: 5.5,
    quantity: 4,
    item_id: "thisIsBread",
    claimerList: "1, 2, 3",
  },
  {
    id: 2,
    item_name: "milk",
    price: 16.5,
    quantity: 1,
    item_id: "thisIsMilk",
    claimerList: "3",
  },
  {
    id: 3,
    item_name: "butter",
    price: 8.5,
    quantity: 3,
    item_id: "thisIsButter",
    claimerList: "3, 4",
  },
];

let claimItems = [
  { item_name: "bread", quantity: 1 },
  { item_name: "butter", quantity: 1 },
];
const itemQuantityMap = new Map();
for (let item of receiptItems) {
  let itemID = item.item_id;
  let claimableQuantity = item.quantity - item.claimerList.split(",").length;
  itemQuantityMap.set(item.item_name, { claimableQuantity, itemID });
}
for (let userClaim of claimItems) {
  if (itemQuantityMap.get(userClaim.item_name) === undefined) {
    console.log({ error: `${userClaim.item_name} is not in this receipt` });
  } else if (userClaim.quantity <= 0) {
    console.log({
      error: `Please claim a positive number of ${userClaim.item_name}`,
    });
  } else if (
    userClaim.quantity >
    itemQuantityMap.get(userClaim.item_name).claimableQuantity
  ) {
    console.log({
      error: `User may not claim more ${userClaim.item_name} than there is remaining`,
    });
  } else {
    console.log(
      `Successfully claimed ${userClaim.quantity} ${userClaim.item_name}`
    );
  }
}
