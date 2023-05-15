// Buffer Line
const returnButton = document.getElementById("return");
const updateForm = document.getElementById("updateInfoForm");

const newPassword = document.getElementById("newPasswordEntry");
const newPasswordDouble = document.getElementById("newPasswordReEntry");
const newUsername = document.getElementById("newUsernameEntry");
const newPhoneNumber = document.getElementById("phoneNumber");
const newPayMeLink = document.getElementById("payMeLink");
const newFPS = document.getElementById("fpsID");

updateForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (
    newPassword.value !== "" &&
    newPassword.value !== newPasswordDouble.value
  ) {
    Swal.fire({
      icon: "error",
      title: "Password re-Entry does not match initial Input",
    });
    return;
  }

  let formData = {};
  formData.password = newPassword.value;
  formData.name = newUsername.value;
  formData.phone_number = newPhoneNumber.value;
  formData.payme_link = newPayMeLink.value;
  formData.fps_id = newFPS.value;

  let res = await fetch("/updateProfile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
  let result = await res.json();
  if (result.error) {
    Swal.fire({
      icon: "error",
      title: result.error,
    });
    newPassword.value = "";
    newPasswordDouble.value = "";
    return;
  } else {
    Swal.fire({
      icon: "success",
      title: "Information Successfully Updated",
    });
    window.location.href = "./homepage.html";
  }
});

returnButton.addEventListener("click", () => {
  window.location.href = "./homepage.html";
});

logOutBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  const response = await fetch("/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      success: "logout",
    }),
  });
  let logout = await response.json();
  if (logout.success) {
    window.location.href = "./";
  }
});
