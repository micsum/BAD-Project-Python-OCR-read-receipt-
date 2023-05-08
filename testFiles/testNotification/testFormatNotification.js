// Buffer Line

/* Test Data Set 1 */
testNotificationData = [
  {
    id: 1,
    from: 1,
    to: 2,
    payment: false,
    receipt_id: "receipt1",
    information: `This is message 1`,
  },
  {
    id: 2,
    from: 1,
    to: 3,
    payment: false,
    receipt_id: "receipt1",
    information: `This is message 2`,
  },
  {
    id: 3,
    from: 1,
    to: 4,
    payment: false,
    receipt_id: "receipt1",
    information: `This is message 3`,
  },
  {
    id: 4,
    from: 1,
    to: 5,
    payment: false,
    receipt_id: "receipt1",
    information: `This is message 4`,
  },
  {
    id: 5,
    from: 2,
    to: 1,
    payment: true,
    receipt_id: "receipt2",
    information: `This is message 5`,
  },
  {
    id: 6,
    from: 2,
    to: 3,
    payment: false,
    receipt_id: "receipt2",
    information: `This is message 6`,
  },
  {
    id: 7,
    from: 4,
    to: 2,
    payment: false,
    receipt_id: "receipt3",
    information: `This is message 7`,
  },
  {
    id: 8,
    from: 4,
    to: 3,
    payment: false,
    receipt_id: "receipt3",
    information: `This is message 8`,
  },
  {
    id: 9,
    from: 5,
    to: 1,
    payment: true,
    receipt_id: "receipt4",
    information: `This is message 9`,
  },
];

testUserNameData = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "David" },
  { id: 5, name: "Elvis" },
];

let secondParty = [];
for (let notification of testNotificationData) {
  if (secondParty.indexOf(notification.from) == -1) {
    secondParty.push(notification.from);
  } else if (secondParty.indexOf(notification.to) == -1) {
    secondParty.push(notification.to);
  }
}

const userIDNameMap = new Map();
for (let userName of testUserNameData) {
  userIDNameMap.set(userName.id, userName.name);
}

for (let notification of testNotificationData) {
  notification.from = userIDNameMap.get(notification.from);
  notification.to = userIDNameMap.get(notification.to);
}

for (let notification of testNotificationData) {
  console.log(`Formatted : ${"\n"} id: ${notification.id},
 from: ${notification.from},
 to: ${notification.to},
 payment: ${notification.payment},
 receipt_id: ${notification.receipt_id},
 information: ${notification.information},`);
}
