const returnMain = document.querySelector("#return");
const logOutBtn = document.querySelector("#logout");
returnMain.addEventListener("click", () => {
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
//fetch info not yet done update pw //
