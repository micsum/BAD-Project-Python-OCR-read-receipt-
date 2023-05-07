/* Testing Data Set 1*/
temporarySelections = [
  { user_id: 1, itemStringID: "thisIsBread", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsBread", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 3, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsButter", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsBeer", quantity: 1 },
];
itemList = ["thisIsBread", "thisIsMilk", "thisIsButter"];
userID = 1;

/* Testing Data Set 2
temporarySelections = [
  { user_id: 1, itemStringID: "thisIsBread", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsBread", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 3, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsButter", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsBeer", quantity: 1 },
];
itemList = ["thisIsBread", "thisIsMilk", "thisIsButter"];
userID = 2;
*/

/* Testing Data Set 3
temporarySelections = [
  { user_id: 1, itemStringID: "thisIsBread", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsBread", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 3, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsButter", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsBeer", quantity: 1 },
];
itemList = ["thisIsBread", "thisIsMilk", "thisIsButter"];
userID = 3;
*/

let userClaimRecord = temporarySelections.filter((elem) => {
  return elem.user_id === userID && itemList.indexOf(elem.itemStringID) !== -1;
});

console.log(userClaimRecord);

/* result for Data Set 1 
[
  { user_id: 1, itemStringID: 'thisIsBread', quantity: 1 },
  { user_id: 1, itemStringID: 'thisIsMilk', quantity: 1 }
]
*/
