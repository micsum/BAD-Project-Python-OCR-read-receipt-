const stripe = Stripe(
  "pk_test_51N7XVOJtmaIoojFvS7PLBNHaAdEc2Rf8ViFTEdq3NLTILWrsaqrJ7AXErvrGweacm226KESFkx3yxI5dtx8Y9u6400sRbQ5Z60"
);

const elements = stripe.elements();
const cardElement = elements.create("card");
cardElement.mount(document.querySelector("#card-element"));
const amountInput = document.getElementById("amount");
const topUpForm = document.querySelector("#topUpForm");
topUpForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const amount = amountInput.value;

  const response = await fetch("/top-up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amount }),
  });

  const { clientSecret } = await response.json();

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
    },
  });
  if (result.error) {
    console.error(result.error.message);
    Swal.fire({
      icon: "error",
      title: "Fail to top up",
    });
  } else {
    const paymentIntentId = result.paymentIntentId;
    const response = await fetch("/top-up/success", {
      method: "POST",
      header: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
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
