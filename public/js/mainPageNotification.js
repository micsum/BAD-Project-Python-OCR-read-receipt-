// Buffer Line
let createButton = document.querySelector("#create");
const notificationTemplate = document.getElementById("notificationTemplate");
let notificationDiv = document.getElementById("notificationDisplayDiv");

let userName, userID;

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

  res = await fetch("/getNotifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sentFromUser: true }),
  });
  result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      title: result.error,
    });
  }
  let notificationData = result.notifications;
  const notificationMap = new Map();
  for (let notification of notificationData) {
    if (notification.confirmStatus) {
      notification.information = `You sent a receipt out for claim (receipt ID : ${notification.receiptStringID})`;
    } else {
      notification.information = `You sent a receipt out for claim (receipt ID : ${notification.receiptStringID})`;
    }
    console.log(`init ${notification}`);
    let notificationSender = notification.notificationSender;
    let notificationStringID = notification.receiptStringID;
    let notificationConfirm = notification.confirm_selection;

    let userMessageInformation = notificationMap.get(notificationSender);
    if (userMessageInformation == undefined) {
      displayNotification(notification, notificationDiv);
      console.log(notification);
      notificationMap.set(notificationSender, [
        {
          receiptStringID: notificationStringID,
          confirmStatus: [notificationConfirm],
        },
      ]);
    } else {
      let duplicate = false;
      for (let row of userMessageInformation) {
        if (row.receiptStringID == notificationStringID) {
          duplicate = true;
          if (row.confirmStatus.indexOf(notificationConfirm) != -1) {
            break;
          } else {
            displayNotification(notification, notificationDiv);
            row.confirmStatus.push(notificationConfirm);
            break;
          }
        }
      }
      if (!duplicate) {
        displayNotification(notification, notificationDiv);
        console.log(notification);
        userMessageInformation.push({
          receiptStringID: notificationStringID,
          confirmStatus: [notificationConfirm],
        });
      }
    }
  }
  socket.emit("joinUserSocketRoom", { userID: userID.toString() });
});