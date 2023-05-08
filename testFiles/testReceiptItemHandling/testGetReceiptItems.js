// Buffer Line
const receiptItems = [
  {
    id: 1,
    item_name: "bread",
    price: 5.5,
    quantity: 4,
    item_id: "thisIsBread",
  },
  { id: 2, item_name: "milk", price: 16.5, quantity: 1, item_id: "thisIsMilk" },
  {
    id: 3,
    item_name: "butter",
    price: 8.5,
    quantity: 1,
    item_id: "thisIsButter",
  },
  { id: 4, item_name: "beer", price: 25.5, quantity: 1, item_id: "thisIsBeer" },
  { id: 5, item_name: "egg", price: 10.5, quantity: 2, item_id: "thisIsEgg" },
  {
    id: 6,
    item_name: "flour",
    price: 13.5,
    quantity: 3,
    item_id: "thisIsFlour",
  },
];
const receiptItemClaimers = [
  { item_id: 1, user_name: "Alice" },
  { item_id: 1, user_name: "Bob" },
  { item_id: 1, user_name: "Charlie" },
  { item_id: 1, user_name: "David" },
  { item_id: 2, user_name: "Bob" },
  { item_id: 3, user_name: "Alice" },
  { item_id: 4, user_name: "David" },
  { item_id: 5, user_name: "Bob" },
  { item_id: 5, user_name: "Charlie" },
  //{ item_id: 6, user_name: "Charlie" },
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

for (let item of receiptItems) {
  let claimerList = "";
  if (itemClaimerMap.get(item.id) !== undefined) {
    claimerList = itemClaimerMap.get(item.id);
  }
  item["claimerList"] = claimerList;
}

console.log(receiptItems);
/* Results
[
    {
      id: 1,
      item_name: 'bread',
      price: 5.5,
      quantity: 4,
      item_id: 'thisIsBread',
      claimerList: 'Alice, Bob, Charlie, David'
    },
    {
      id: 2,
      item_name: 'milk',
      price: 16.5,
      quantity: 1,
      item_id: 'thisIsMilk',
      claimerList: 'Bob'
    },
    {
      id: 3,
      item_name: 'butter',
      price: 8.5,
      quantity: 1,
      item_id: 'thisIsButter',
      claimerList: 'Alice'
    },
    {
      id: 4,
      item_name: 'beer',
      price: 25.5,
      quantity: 1,
      item_id: 'thisIsBeer',
      claimerList: 'David'
    },
    {
      id: 5,
      item_name: 'egg',
      price: 10.5,
      quantity: 2,
      item_id: 'thisIsEgg',
      claimerList: 'Bob, Charlie'
    },
    {
      id: 6,
      item_name: 'flour',
      price: 13.5,
      quantity: 3,
      item_id: 'thisIsFlour',
      claimerList: ''
    }
]
*/
