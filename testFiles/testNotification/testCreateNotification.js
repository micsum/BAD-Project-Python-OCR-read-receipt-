// Buffer Line
const userID = 1;
const userName = "Alice";

const notificationTemplate = document.getElementById("notificationTemplate");
let notificationDiv = document.getElementById("notificationDisplayDiv");

function displayNotification(notification, destination) {
  let node = notificationTemplate.content.cloneNode(true);
  let notificationDiv = node.querySelector(".notificationDiv");
  notificationDiv.setAttribute("id", `notification${notification.receipt_id}`);
  notificationDiv.addEventListener("click", function (event) {
    event.preventDefault();
    window.location = `./testReceiptDisplay.html?receiptID=${notification.receipt_id}`;
  });

  let receiptSender = notification.from;
  if (receiptSender == userName) {
    receiptSender = "You";
  }
  node.querySelector(".notificationSender").textContent = receiptSender;

  let payment = notification.payment;
  node.querySelector(".moneyIcon").innerHTML = payment
    ? `<i class="bi bi-piggy-bank"></i>`
    : `<i class="bi bi-coin"></i>`;

  node.querySelector(".message").textContent = notification.information;
  destination.appendChild(node);
}

for (let notification of testNotificationData) {
  if (notification.from == userName || notification.to == userName) {
    displayNotification(notification, notificationDiv);
  }
}
