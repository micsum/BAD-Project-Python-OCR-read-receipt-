// Buffer Line
const notificationTemplate = document.getElementById("notificationTemplate");
let notificationDiv = document.getElementById("notificationDisplayDiv");

let userName;
let userID;

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
      Swal.fire(
        {
          icon: "question",
          title: "Pay with in-app credit?",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "Yes, please",
          denyButtonText: "No, I will use payMe/FPS",
        }.then(async (result) => {
          let creditMode;
          if (result.isConfirmed) {
            creditMode = true;
          } else if (result.isDenied) {
            creditMode = false;
          } else {
            return;
          }
          let res = await fetch("/respondPayMessage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              creditMode: creditMode,
              receiptID: notification.receipt_id,
            }),
          });
          let result2 = await res.json();
          if (result2.error) {
            Swal.fire({
              icon: "error",
              title: "An Error Occurred",
              text: result2.error,
            });
          }
        })
      );
    } else {
      // Call Sweet Alert Display Receipt Not Found Error
    }
  });

  let icon;
  let receiptSender = notification.notificationSender;
  if (receiptSender == userName) {
    //userName
    let payment = notification.payment;
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
});
