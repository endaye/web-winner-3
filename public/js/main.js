if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

function ready() {
    var years = document.getElementsByClassName('current-year')
    for (var i = 0; i < years.length; i++) {
        years[i].innerText = new Date().getFullYear()
    }
    var emails = document.getElementsByClassName('winner-bot-email')
    for (var i = 0; i < emails.length; i++) {
        emails[i].innerText = " " + getCookie('winner-bot-email')
    }
    var purchaseLoading = document.getElementsByClassName('purchase-loading')
    if (purchaseLoading) {
        purchaseLoading[0].style.visibility = 'hidden';
    }
}

function purchaseClicked() {
    // alert('Thank you for your purchase')
    var email = document.getElementById('buy-custom-email').value
    if (!ValidateEmail(email)) {
        return
    }
    document.getElementsByClassName('purchase')[0].style.visibility = 'hidden';
    document.getElementsByClassName('purchase')[0].style.height = 0;
    document.getElementsByClassName('purchase-loading')[0].style.visibility = 'visible';
    setCookie('winner-bot-email', email, 1)
    // console.log(getCookie('winner-bot-email'))
    // console.log(stripePublicKey)
    var stripe = Stripe(stripePublicKey);
    fetch('/purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            email: email
        })
    }).then((res) => {
        return res.json()
    }).then((data) => {
        // console.log(data.sessionId)
        var sessionId = data.sessionId
        if (sessionId != undefined) {
            stripe.redirectToCheckout({
                // Make the id field from the Checkout Session creation API response
                // available to this file, so you can provide it as parameter here
                // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
                sessionId: sessionId,
            }).then(function (result) {
                // If `redirectToCheckout` fails due to a browser or network
                // error, display the localized error message to your customer
                // using `result.error.message`.
                document.location.href = "payment-cancel";
            });
        } else {
            document.location.href = "payment-cancel";
        }
    }).catch((error) => {
        // console.error(error)
        document.location.href = "payment-cancel";
    })
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function ValidateEmail(mail) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
        return (true)
    }
    alert("You have entered an invalid email address!")
    return (false)
}