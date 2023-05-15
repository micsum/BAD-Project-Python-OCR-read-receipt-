// Buffer Line
const form = document.getElementById("registrationForm");
const returnButton = document.getElementById("return");

let newUserName = document.getElementById("newUsernameEntry");
let newPassword = document.getElementById("newPasswordEntry");
let reEnterPassword = document.getElementById("newPasswordReEntry");
let newPhoneNumber = document.getElementById("phoneNumber");
let newEmail = document.getElementById("email");
let newPayMeLink = document.getElementById("payMeLink");
let newFPSID = document.getElementById("fpsID");

returnButton.addEventListener("click", () => {
  window.location.href = "/index.html";
});

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  console.log("f:", `${newPassword.value}`, "s", `${reEnterPassword.value}`);
  if (newPassword.value != reEnterPassword.value) {
    Swal.fire({
      icon: "error",
      title: "Password Mismatch",
      text: "Re-entry of password does not match initial input",
    });
    reEnterPassword.value = "";
    return;
  }
  let formData = {
    username: newUserName.value,
    password: newPassword.value,
    phoneNumber: newPhoneNumber.value,
    email: newEmail.value,
    payMeLink: newPayMeLink.value,
    fpsLink: newFPSID.value,
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
  Swal.fire({
    icon: "success",
    title: "User Created",
    preConfirm: () => {
      window.location.href = "./index.html";
    },
  });
});
