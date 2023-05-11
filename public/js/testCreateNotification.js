// Buffer Line

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
          let result = await res.json();
          if (result.error) {
            Swal.fire({
              icon: "error",
              title: "An Error Occurred",
              text: result.error,
            });
          }
        })
      );
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
window.addEventListener("load", async (event) => {
  event.preventDefault();
  let res = await fetch("/getNotifications");

  let dbResult = await res.json();
  if (dbResult.error) {
    Swal.fire({
      icon: "error",
      title: dbResult.error,
    });
  }
  let notificationData = dbResult.notifications;
  for (let notification of notificationData) {
    displayNotification(notification, notificationDiv);
  }
});
