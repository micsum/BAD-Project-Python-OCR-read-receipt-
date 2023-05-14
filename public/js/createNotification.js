// Buffer Line
let createButton = document.querySelector("#create");
const notificationTemplate = document.getElementById("notificationTemplate");
let notificationDiv = document.getElementById("notificationDisplayDiv");

let userName, userID;

function displayNotification(notification, destination) {
  let node = notificationTemplate.content.cloneNode(true);
  let notificationDiv = node.querySelector(".notificationDiv");
  notificationDiv.setAttribute(
    "id",
    `notification${notification.receiptStringID}`
  );
  notificationDiv.addEventListener("click", async function (event) {
    event.preventDefault();
    let res = await fetch(
      `/getReceiptClaimConfirmStatus/${notification.receiptStringID}`
    );
    let result = await res.json();
    if (result.receiptStatus == false) {
      window.location = `./receiptDisplayPage.html?receiptID=${notification.receiptStringID}`;
    } else if (result.receiptStatus == true) {
      Swal.fire({
        icon: "question",
        title: "Please Select Payment Method",
        html: `<select id="paymentChoice">
        <option value="credit">credit</option>
        <option value="fps">FPS</option>
        <option value="payMe">PayMe</option>
      </select>`,
        showCancelButton: true,
        confirmButtonText: "Confirm Selection",
        preConfirm: async () => {
          let paymentChoice = document.getElementById("paymentChoice").value;
          let creditMode = paymentChoice == "credit";
          let res = await fetch("/respondPayMessage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              creditMode: creditMode,
              receiptStringID: notification.receiptStringID,
            }),
          });
          let result2 = await res.json();
          if (result2.error) {
            Swal.fire({
              icon: "error",
              title: "An Error Occurred",
              text: result2.error,
            });
          } else {
            Swal.fire({
              icon: "success",
              title: "Successfully Paid",
            });
          }
        },
      });
    }
  });

  let icon;
  let receiptSender = notification.notificationSender;
  let notificationMessage = notification.information;
  let payment = notification.payment;
  if (receiptSender == userName) {
    receiptSender = "You";
    notificationMessage = "You sent a receipt successfully";
    icon = payment ? "bank" : "wallet";
  } else {
    icon = payment ? "piggy-bank" : "coin";
  }
  node.querySelector(".notificationSender").textContent = receiptSender;

  node.querySelector(".moneyIcon").innerHTML = `<i class="bi bi-${icon}"></i>`;

  node.querySelector(".message").textContent = notificationMessage;
  destination.appendChild(node);
}
window.addEventListener("load", async (event) => {
  event.preventDefault();
  let res = await fetch("/getUserName");
  let result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      title: result.error,
    });
  }
  userName = result.userName;
  userID = result.userID;

  res = await fetch("/getNotifications");
  result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      title: result.error,
    });
  }
  let notificationData = result.notifications;
  for (let notification of notificationData) {
    displayNotification(notification, notificationDiv);
  }
  socket.emit("joinUserSocketRoom", { userID: userID.toString() });
});
