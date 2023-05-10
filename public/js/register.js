// Buffer Line
const form = document.getElementById("registrationForm");
const returnButton = document.getElementById("return");

let newUserName = document.getElementById("newUsernameEntry").value;
let newPassword = document.getElementById("newPasswordEntry").value;
let reEnterPassword = document.getElementById("newPasswordReEntry");
let newPhoneNumber = document.getElementById("phoneNumber").value;
let newEmail = document.getElementById("email").value;
let newPayMeLink = document.getElementById("payMeLink").value;
let newFPSID = document.getElementById("fpsID").value;

returnButton.addEventListener("click", () => {
  window.location.href = "/index.html";
});

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (newPassword !== reEnterPassword.value) {
    Swal.fire({
      icon: "error",
      title: "Password Mismatch",
      text: "Re-entry of password does not match initial input",
    });
    reEnterPassword.value = "";
    return;
  }
  let formData = {
    username: newUserName,
    password: newPassword,
    phoneNumber: newPhoneNumber,
    email: newEmail,
    payMeLink: newPayMeLink,
    fpsLink: newFPSID,
  };

  let res = await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
  let result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      title: "An Error Occurred",
      text: result.error,
    });
  }
});
