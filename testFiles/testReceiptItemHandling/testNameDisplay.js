// Buffer Line
function formatClaimedUserNameList(claimedUserName) {
  let nameList = claimedUserName.split(",");
  let previousName = "";
  let finalString = "";
  let nameCount = 0;

  for (let userName of nameList) {
    if (userName.trim() == previousName.trim()) {
      nameCount++;
    } else {
      if (previousName != "") {
        finalString += `${previousName} x${nameCount + 1}, `;
        nameCount = 0;
      }
    }
    previousName = userName;
  }
  if (previousName != "") {
    finalString += `${previousName} x${nameCount + 1} `;
  }
  return finalString;
}

let nameLists = [
  //"Charlie",
  //"Alice, Bob",
  //"Alice, Bob, Bob",
  //"Bob, Bob, Charlie, Charlie",
  "Alice, Alice, Charlie, David, David, David",
];

for (let nameList of nameLists) {
  console.log(formatClaimedUserNameList(nameList));
}
