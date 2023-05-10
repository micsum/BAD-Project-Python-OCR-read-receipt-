// Buffer Line
const userID = 1;
const userName = "Alice";

const notificationTemplate = document.getElementById("notificationTemplate");
let notificationDiv = document.getElementById("notificationDisplayDiv");

function displayNotification(notification, destination) {
  let node = notificationTemplate.content.cloneNode(true);
  let notificationDiv = node.querySelector(".notificationDiv");
  notificationDiv.setAttribute("id", `notification${notification.receipt_id}`);
  notificationDiv.addEventListener("click", async function (event) {
    event.preventDefault();
    let res = await fetch(
      `/getReceiptClaimConfirmStatus/${notification.receipt_id}`
    );
    let result = await res.json();
    if (result.status == false) {
      window.location = `./testReceiptDisplay.html?receiptID=${notification.receipt_id}`;
    } else if (result.status == true) {
      // Call Sweet Alert Ask Pay Method
    } else {
      // Call Sweet Alert Display Receipt Not Found Error
    }
  });

  let icon;
  let receiptSender = notification.from;
  if (receiptSender == userName) {
    receiptSender = "You";
    icon = payment ? "bank" : "wallet";
  } else {
    icon = payment ? "piggy-bank" : "coin";
  }
  node.querySelector(".notificationSender").textContent = receiptSender;

  let payment = notification.payment;

  node.querySelector(".moneyIcon").innerHTML = `<i class="bi bi-${icon}"></i>`;

  node.querySelector(".message").textContent = notification.information;
  destination.appendChild(node);
}

for (let notification of testNotificationData) {
  if (notification.from == userName || notification.to == userName) {
    displayNotification(notification, notificationDiv);
  }
}
