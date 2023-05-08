// Buffer Line
itemList = [
  { item_name: "bread", price: 5.5, quantity: 3 },
  { item_name: "milk", price: 16.5, quantity: 2 },
  { item_name: "butter", price: 13.5, quantity: 2 },
];

let receiptID = "thisIsReceipt";
let newItemList = [];
for (let item of itemList) {
  let itemID = Math.random().toString(36).slice(2).substring(0, 5);
  item["receipt_id"] = receiptID;
  item["item_ID"] = itemID;
  newItemList.push(item);
}

console.log(newItemList);
