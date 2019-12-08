// ref: https://www.youtube.com/watch?v=mI_-1tbIXQI

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

console.log(stripeSecretKey, stripePublicKey)

const express = require('express')
const app = express()
const fs = require('fs')
const expressLayouts = require('express-ejs-layouts')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))
app.use(expressLayouts)

stripe.checkout.sessions.create({
        success_url: 'http://localhost:13000/payment-succecc',
        cancel_url: 'http://localhost:13000/payment-fail',
        payment_method_types: ['card'],
        line_items: [{
            name: 'T-shirt',
            description: 'Comfortable cotton t-shirt',
            amount: 1500,
            currency: 'usd',
            quantity: 2,
        }, ],
        locale: 'auto',
    },
    function (err, session) {
        // asynchronously called
    }
);

app.get('/', (req, res) => {
    res.render('home.ejs', {
        active: 'home'
    })
})

app.get('/purchase', (req, res) => {
    res.render('purchase.ejs', {
        active: 'purchase'
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

app.get('payment-succecc', (req, res) => {
    res.render('payment-succecc.ejs', {
        active: null,
        email: 'name@example.com'
    })
})

app.get('payment-fail', (req, res) => {
    res.render('payment-fail.ejs', {
        active: null
    })
})

app.get('/store', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if (error) {
            res.status(500).end()
        } else {
            res.render('store.ejs', {
                stripePublicKey: stripePublicKey,
                items: JSON.parse(data)
            })
        }
    })
})

app.post('/purchase', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if (error) {
            res.status(500).end()
        } else {
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            let total = 0
            req.body.items.forEach((item) => {
                const itemJson = itemsArray.find((i) => {
                    return i.id == item.id
                })
                total = total + itemJson.price * item.quantity
            })
            stripe.charges.create({
                amount: total,
                source: req.body.stripeTokenId,
                currency: 'usd'
            }).then(() => {
                console.log('Charge Successful')
                res.json({
                    message: 'Successfully purchased items'
                })
            }).catch(() => {
                console.log('Charge Fail')
                res.status(500).end()
            })
        }
    })
})

app.get('*', function (req, res) {
    res.status(404).redirect('/');
});

app.listen(13000)