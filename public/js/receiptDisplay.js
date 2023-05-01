//Buffer Line
const receipt = document.getElementById("receipt");
const claimedItems = document.getElementById("claimedItems");
const receiptItemTemplate = document.getElementById("receiptItem");

let userID = "";
//const socket = io.connect();

/* Testing Components */
let itemInfo = {
  quantity: 4,
  itemName: "bread",
  itemID: "thisIsBread",
  price: 5.5,
};

let itemInfo2 = {
  quantity: 1,
  itemName: "milk",
  itemID: "thisIsMilk",
  price: 13.5,
};

let itemInfo3 = {
  quantity: 2,
  itemName: "butter",
  itemID: "thisIsButter",
  price: 18.5,
};

let htmlDiv = {
  intendedLocation: receipt,
  newLocation: claimedItems,
};

let claimedUserName = "Alice, Bob, Charlie";
let claimedUserName2 = "David";
let claimedUserName3 = "Bob, David";

createItem(itemInfo, htmlDiv, receiptItemTemplate, claimedUserName, true);
createItem(itemInfo2, htmlDiv, receiptItemTemplate, claimedUserName2, true);
createItem(itemInfo3, htmlDiv, receiptItemTemplate, claimedUserName3, true);
