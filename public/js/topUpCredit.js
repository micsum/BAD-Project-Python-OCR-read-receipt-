const stripe = Stripe("pk_test_51N7XVOJtmaIoojFvS7PLBNHaAdEc2Rf8ViFTEdq3NLTILWrsaqrJ7AXErvrGweacm226KESFkx3yxI5dtx8Y9u6400sRbQ5Z60");


const amountInput = document.getElementById("amount");
const topUpForm = document.querySelector("#topUpForm");
topUpForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const amount = amountInput.value;
  const response = await fetch("/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amount }),
  })
  let result = response.json();
  
  //const { clientSecret } = await response.json();
  if (result.error) {
    console.error(result.error.message);
    Swal.fire({
      icon: "error",
      title: "Fail to top up",
    });
  } else {
    const response = await fetch("/webhook", {
      method: "POST",
      header: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const { success } = await response.json();
    if (success) {
      Swal.fire({
        icon: "success",
        title: `${amount} has been topped up in your credit`,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Fail to top up",
        text: "Please enter correct information.",
      });
    }
  }
});
