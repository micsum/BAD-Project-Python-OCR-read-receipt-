function displayNotification(notification, destination) {
  let node = notificationTemplate.content.cloneNode(true);
  let notificationDiv = node.querySelector(".notificationDiv");
  let notificationSender = notification.notificationSender;
  let receiptSender = notification.receiptSender;

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

    if (
      receiptSender == userID ||
      result.receiptStatus == false ||
      notificationSender == userID
    ) {
      window.location = `./receiptDisplayPage.html?receiptID=${notification.receiptStringID}`;
    } else if (result.receiptStatus == true && notificationSender != userID) {
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
          console.log(`result2 : ${result2.hostPayme}`);
          if (result2.error) {
            Swal.fire({
              icon: "error",
              title: "An Error Occurred",
              text: result2.error,
            });
          } else if (
            paymentChoice == "payMe" &&
            result2.hostPayme != undefined
          ) {
            console.log("payme", result2.hostPayme);
            window.location.replace(`https://payme.hsbc/${result2.hostPayme}`);
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
  if (notificationSender == userID) {
    if (notificationMessage.substring(0, 7) == "Updated") {
      notificationMessage = `You claimed items successfully `;
      icon = "wallet";
    } else {
      let lowerDiv = node.querySelector(".lowerDiv");
      let dummyText = confirmSelection ? "claim request" : "receipt";
      notificationMessage = `You sent a ${dummyText} successfully`;
      let dateDiv = document.createElement("div");
      dateDiv.classList.add(["cursor-pointer", "border-blue-500"]);
      dateDiv.textContent = `Created at ${new Date(notification.created_at)
        .toLocaleString()
        .slice(0, 10)}`;

      let TotalDiv = document.createElement("div");
      TotalDiv.classList.add(["cursor-pointer", "border-blue-500"]);
      TotalDiv.textContent = `Total: ${"$" + notification.total}`;
      lowerDiv.appendChild(TotalDiv);
      lowerDiv.appendChild(dateDiv);
      icon = payment ? "bank" : "piggy-bank";
    }
    node.querySelector(".sender").hidden = true;
  } else {
    icon = "coin";
  }
  node.querySelector(
    ".receiptID"
  ).textContent = `(receiptID : ${notification.receiptStringID})`;

  node.querySelector(".notificationSender").textContent = notificationSender;

  node.querySelector(".moneyIcon").innerHTML = `<i class="bi bi-${icon}"></i>`;

  node.querySelector(".message").textContent = notificationMessage;

  destination.appendChild(node);
}
