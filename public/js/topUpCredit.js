const stripe = Stripe(
  "pk_test_51N7XVOJtmaIoojFvS7PLBNHaAdEc2Rf8ViFTEdq3NLTILWrsaqrJ7AXErvrGweacm226KESFkx3yxI5dtx8Y9u6400sRbQ5Z60"
);
const elements = stripe.elements();
const cardElement = elements.create("card");
cardElement.mount("#card-element");
const amountInput = document.getElementById("amount");
const topUpForm = document.querySelector("#topUpForm");
const payForm = document.querySelector("#payForm");
topUpForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const amount = amountInput.value;

  const { clientSecret } = await fetch("/create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  }).then((res) => res.json());

  topUpForm.CDATA_SECTION_NODE.clientSecret = clientSecret;

  topUpForm.style.display = "none";
  payForm.style.display = "block";

  payForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });
    if (error) {
      // Display an error message if the payment method creation fails
      const errorElement = document.getElementById("card-errors");
      errorElement.textContent = error.message;
    } else {
      const paymentIntentId = payForm.dataset.clientSecret;
    }
  });
});
