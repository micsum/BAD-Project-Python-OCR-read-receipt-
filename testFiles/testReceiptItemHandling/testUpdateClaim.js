/* Test Data Set 1 
temporarySelections = [
  { user_id: 1, itemStringID: "thisIsBread", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsBread", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 3, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsButter", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsBeer", quantity: 1 },
];
*/
/* Test Data Set 2 
temporarySelections = [
  { user_id: 1, itemStringID: "thisIsBread", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsBread", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 3, itemStringID: "thisIsMilk", quantity: 1 },
  { user_id: 2, itemStringID: "thisIsButter", quantity: 2 },
  { user_id: 1, itemStringID: "thisIsButter", quantity: 1 },
];
*/

/* Update Claim 
updateClaim = { user_id: 1, itemStringID: "thisIsMilk", quantity: 3 };

let { itemStringID, quantity, user_id } = updateClaim;

let updated = false;
for (let tempClaim of temporarySelections) {
  if (
    tempClaim.itemStringID === itemStringID &&
    tempClaim.user_id === user_id
  ) {
    tempClaim.quantity = quantity;
    updated = !updated;
    break;
  }
}

if (!updated) {
  console.log({ error: "Claim Record Not Found" });
}
*/

/* Delete Claim */
deleteClaim = { user_id: 2, itemStringID: "thisIsMilk" };

let { itemStringID, user_id } = deleteClaim;

let deleted = false;
for (let tempClaim of temporarySelections) {
  if (
    tempClaim.itemStringID === itemStringID &&
    tempClaim.user_id === user_id
  ) {
    temporarySelections.splice(temporarySelections.indexOf(tempClaim), 1);
    deleted = !deleted;
    break;
  }
}

if (!deleted) {
  console.log({ error: "Claim Record Not Found" });
}

console.log(temporarySelections);
