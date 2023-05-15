function displayNotification(notification, destination) {
  let node = notificationTemplate.content.cloneNode(true);
  let notificationDiv = node.querySelector(".notificationDiv");
  let receiptSender = notification.notificationSender;
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

    if (result.receiptStatus == false || receiptSender == userName) {
      window.location = `./receiptDisplayPage.html?receiptID=${notification.receiptStringID}`;
    } else if (result.receiptStatus == true && receiptSender != userName) {
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
  let notificationMessage = notification.information;
  let confirmSelection = notification.confirm_selection;
  let payment = notification.payment;
  if (receiptSender == userName) {
    if (notificationMessage.substring(0, 7) == "Updated") {
      notificationMessage = `You claimed items successfully (receiptID : ${notification.receiptStringID})`;
    } else {
      let dummyText = confirmSelection ? "claim request" : "receipt";
      notificationMessage = `You sent a ${dummyText} successfully (receiptID : ${notification.receiptStringID})`;
      icon = payment ? "bank" : "piggy-bank";
    }
    node.querySelector(".notificationSender").hidden = true;
  } else {
    icon = payment ? "wallet" : "coin";
  }
  node.querySelector(".notificationSender").textContent = receiptSender;

  node.querySelector(".moneyIcon").innerHTML = `<i class="bi bi-${icon}"></i>`;

  node.querySelector(".message").textContent = notificationMessage;

  destination.appendChild(node);
}
