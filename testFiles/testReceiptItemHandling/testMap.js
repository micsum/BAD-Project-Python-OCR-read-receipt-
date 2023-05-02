receiptItemClaimers = [
  { item_id: 1, user_id: 1 },
  { item_id: 1, user_id: 2 },
  { item_id: 2, user_id: 2 },
  { item_id: 3, user_id: 3 },
  { item_id: 3, user_id: 3 },
  { item_id: 3, user_id: 4 },
];

const itemClaimerMap = new Map();
for (let claimer of receiptItemClaimers) {
  if (itemClaimerMap.get(claimer.item_id) === undefined) {
    itemClaimerMap.set(claimer.item_id, claimer.user_id.toString());
  } else {
    let claimerList = itemClaimerMap.get(claimer.item_id);
    claimerList += ", " + claimer.user_id.toString();
    itemClaimerMap.set(claimer.item_id, claimerList);
  }
}

console.log(itemClaimerMap);
console.log(itemClaimerMap.get(3));
