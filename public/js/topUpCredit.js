const stripe = Stripe('pk_test_51N7XVOJtmaIoojFvS7PLBNHaAdEc2Rf8ViFTEdq3NLTILWrsaqrJ7AXErvrGweacm226KESFkx3yxI5dtx8Y9u6400sRbQ5Z60');
const elements = stripe.elements();
const cardElement = elements.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#32325d',
      }
    }
  });
cardElement.mount('#card-element');
const cardErrors = document.getElementById('card-errors');
const amountInput = document.getElementById('amount');
const payButton = document.getElementById('submit');


cardElement.on('change', function(event) {
  if (event.error) {
    cardErrors.textContent = event.error.message;
  } else {
    cardErrors.textContent = '';
  }
});

payButton.addEventListener('click', function() {
  payButton.disabled = true;
  stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
  }).then(function(result) {
    if (result.error) {
      cardErrors.textContent = result.error.message;
      payButton.disabled = false;
    } else {
      fetch('/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethodId: result.paymentMethod.id,
          amount: amountInput.value
        })
      }).then(function(result) {
        return result.json();
      }).then(function(data) {
        if (data.requiresAction) {
          stripe.handleCardAction(data.clientSecret).then(function(result) {
            if (result.error) {
              cardErrors.textContent = result.error.message;
              payButton.disabled = false;
            } else {
              fetch('/pay', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  paymentIntentId: result.paymentIntent.id
                })
              }).then(function(result) {
                return result.json();
              }).then(function(data) {
                handlePaymentResult(data);
              });
            }
          });
        } else {
          handlePaymentResult(data);
        }
      });
    }
  });
});

function handlePaymentResult(data) {
  if (data.error) {
    cardErrors.textContent = data.error;
    payButton.disabled = false;
  } else if (data.requiresAction) {
    stripe.handleCardAction(data.clientSecret).then(function(result) {
      if (result.error) {
        cardErrors.textContent = result.error.message;
        payButton.disabled = false;
      } else {
        fetch('/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentIntentId: result.paymentIntent.id
          })
        }).then(function(result) {
          return result.json();
        }).then(function(data) {
          handlePaymentResult(data);
        });
      }
    });
  } else {
    alert('Payment succeeded');
    amountInput.value = '';
    payButton.disabled = false;
  }
}