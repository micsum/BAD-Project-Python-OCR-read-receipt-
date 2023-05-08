// Buffer Line
let itemName = ["Alice", "Bob", "Charlie"];

itemName = itemName.join();

console.log(`itemName before : ${itemName}`);

while (itemName.indexOf(",") != -1) {
  itemName = itemName.replace(",", " ");
}

console.log(`itemName after : ${itemName}`);
