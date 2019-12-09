// ref: https://www.youtube.com/watch?v=mI_-1tbIXQI

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const endpointSecret = process.env.STRIPE_WEBHOOK;
const PRIVATE_IP = process.env.PRIVATE_IP || 'localhost'
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const express = require('express')
const app = express()
const fs = require('fs')
const expressLayouts = require('express-ejs-layouts')
const stripe = require('stripe')(stripeSecretKey)

const bodyParser = require('body-parser')

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))
app.use(expressLayouts)

app.get('/', (req, res) => {
    res.render('home.ejs', {
        active: 'home'
    })
})

app.get('/about', (req, res) => {
    res.render('about.ejs', {
        active: 'about'
    })
})

app.get('/privacy-policy', (req, res) => {
    res.render('privacy-policy.ejs', {
        active: null
    })
})

app.get('/refund-policy', (req, res) => {
    res.render('refund-policy.ejs', {
        active: null
    })
})

app.get('/terms-of-service', (req, res) => {
    res.render('terms-of-service.ejs', {
        active: null
    })
})

app.get('/payment-success', (req, res) => {
    const sessionId = req.query.session_id
    // console.log(sessionId)
    res.render('payment-success.ejs', {
        active: null,
        email: 'name@example.com'
    })
})

app.get('/payment-cancel', (req, res) => {
    res.render('payment-cancel.ejs', {
        active: null
    })
})

app.get('/purchase', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if (error) {
            res.status(500).redirect('/');
        } else {
            res.render('purchase.ejs', {
                stripePublicKey: stripePublicKey,
                active: 'purchase',
                items: JSON.parse(data)
            })
        }
    })

})

app.post('/purchase', (req, res) => {
    fs.readFile('items.json', async (error, data) => {
        if (error) {
            console.error(error)
            res.status(500).redirect('/');
        } else {
            const items = JSON.parse(data)
            let total = items.bot.map(x => x.price * x.quantity).reduce((a, b) => a + b, 0)
            // console.log(total)
            const session = await stripe.checkout.sessions.create({
                customer_email: req.body.email,
                payment_method_types: ['card'],
                line_items: [{
                    name: items.bot[0].name,
                    description: items.bot[0].description,
                    images: [items.bot[0].image],
                    amount: total,
                    currency: 'usd',
                    quantity: 1,
                }],
                success_url: `${BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${BASE_URL}/payment-cancel`,
            });
            console.log(session)
            res.json({
                sessionId: session.id
            })
        }
    })
})

app.post('/webhook', bodyParser.raw({
    type: 'application/json'
}), (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Fulfill the purchase...
        // handleCheckoutSession(session);
        console.log(`🔔  Payment received!`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({
        received: true
    });
});

app.get('*', function (req, res) {
    res.status(404).redirect('/');
});

app.listen(PORT, PRIVATE_IP, () => {
    console.log(`🌎  ==> API Server now listening on PORT ${PORT} and IP ${PRIVATE_IP}!   `);
})