// ref: https://www.youtube.com/watch?v=mI_-1tbIXQI

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const endpointSecret = process.env.STRIPE_WEBHOOK
const PRIVATE_IP = process.env.PRIVATE_IP || 'localhost'
const PORT = process.env.PORT || 3001
const BASE_URL = process.env.BASE_URL || `http://${PRIVATE_IP}:${PORT}`
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL
const enterCode = process.env.ENTER_CODE
const express = require('express')
const app = express()
const fs = require('fs')
const util = require('util')
const expressLayouts = require('express-ejs-layouts')
const stripe = require('stripe')(stripeSecretKey)
const bodyParser = require('body-parser')
const fetch = require('node-fetch');
const cookieParser = require("cookie-parser");

const readFilePromise = util.promisify(fs.readFile)

let goods
readFilePromise('json/items.json')
    .then(data => goods = JSON.parse(data))
    .catch(err => console.error(err))

const codes = [enterCode.toUpperCase()]
readFilePromise('json/codes.json')
    .then(data => {
        const code = JSON.parse(data)
        if (code && code.enter && code.enter.length > 0) {
            code.enter.forEach(c => codes.push(c.toUpperCase()))
        }
    }).catch(err => console.error(err))

const sendDiscordWebhook = (msg) => {
    fetch(discordWebhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "username": msg.username,
            "content": msg.content
        })
    }).catch(err => {
        console.error(err)
    })
}

const handleCheckoutSession = (session) => {
    // console.log(session)
    if (session) {
        sendDiscordWebhook({
            username: "Winner-Sell",
            content: `🔔  Payment received!\nemail: ${session.customer_email}`,
        })
    }
}

const checkCode = (req, res, next) => {
    const code = req.cookies['winner-bot-enter-code'] || ""
    if (code === "") {
        res.render('enter.ejs', {
            layout: false,
            enter: "ENTER CODE"
        })
    } else if (codes.includes(code.toUpperCase())) {
        next();
    } else {
        res.render('enter.ejs', {
            layout: false,
            enter: "RE-ENTER CODE"
        })
    }
}

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))
app.use(expressLayouts)
app.use(cookieParser())

app.get('/', checkCode, (req, res) => {
    res.render('home.ejs', {
        active: 'home'
    })
})

app.get('/enter', (req, res) => {
    res.render('enter.ejs', {
        layout: false,
        enter: "ENTER CODE"
    })
})

app.get('/about', checkCode, (req, res) => {
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

app.get('/payment-success', checkCode, (req, res) => {
    const sessionId = req.query.session_id
    // console.log(sessionId)
    res.render('payment-success.ejs', {
        active: null,
    })
})

app.get('/payment-cancel', checkCode, (req, res) => {
    res.render('payment-cancel.ejs', {
        active: null
    })
})

app.get('/purchase', checkCode, (req, res) => {
    if (goods) {
        res.render('purchase.ejs', {
            stripePublicKey: stripePublicKey,
            active: 'purchase',
            items: goods
        })
    } else {
        res.status(500).redirect('/');
    }
})

app.post('/purchase', async (req, res) => {
    if (goods) {
        const items = goods
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
        // console.log(session)
        res.json({
            sessionId: session.id
        })
    } else {
        res.status(500).redirect('/');
    }
})

app.post('/webhook', bodyParser.raw({
    type: 'application/json'
}), (request, response) => {
    let event
    try {
        event = request.body
    } catch (err) {
        console.error(err)
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed':
            // Handle the checkout.session.completed event
            const session = event.data.object;
            // Fulfill the purchase...
            handleCheckoutSession(session);
            console.log(`🔔  Payment received!`);
            break;
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            // handlePaymentIntentSucceeded(paymentIntent);
            break;
        case 'payment_method.attached':
            const paymentMethod = event.data.object;
            // handlePaymentMethodAttached(paymentMethod);
            break;
            // ... handle other event types
        default:
            // Unexpected event type
            return response.status(400).end();
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
    sendDiscordWebhook({
        username: 'Winner-Sell',
        content: `Website is restart, enter code is ${codes.toString()}`
    })
})