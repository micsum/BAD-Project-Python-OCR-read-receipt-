const stripe = Stripe(
  "pk_test_51N7XVOJtmaIoojFvS7PLBNHaAdEc2Rf8ViFTEdq3NLTILWrsaqrJ7AXErvrGweacm226KESFkx3yxI5dtx8Y9u6400sRbQ5Z60"
);

const amountInput = document.getElementById("amount");
const topUpForm = document.querySelector("#topUpForm");
topUpForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const amount = amountInput.value;
  const response = await fetch("/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amount }),
  });
  let result = await response.json();

  //const { clientSecret } = await response.json();
  if (result.error) {
    console.error(result.error);
    Swal.fire({
      icon: "error",
      title: "Fail to top up",
    });
  }
});
