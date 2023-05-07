// Buffer Line
receiptItemClaimers = [
  { item_id: 1, user_name: "Alice" },
  { item_id: 1, user_name: "Bob" },
  { item_id: 2, user_name: "Bob" },
  { item_id: 3, user_name: "Alice" },
  { item_id: 3, user_name: "Charlie" },
  { item_id: 3, user_name: "David" },
];

const itemClaimerMap = new Map();
for (let claimer of receiptItemClaimers) {
  if (itemClaimerMap.get(claimer.item_id) === undefined) {
    itemClaimerMap.set(claimer.item_id, claimer.user_name);
  } else {
    let claimerList = itemClaimerMap.get(claimer.item_id);
    claimerList += ", " + claimer.user_name;
    itemClaimerMap.set(claimer.item_id, claimerList);
  }
}

console.log(itemClaimerMap);
console.log(itemClaimerMap.get(3));
