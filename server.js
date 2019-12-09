// ref: https://www.youtube.com/watch?v=mI_-1tbIXQI

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const express = require('express')
const app = express()
const fs = require('fs')
const expressLayouts = require('express-ejs-layouts')
const stripe = require('stripe')(stripeSecretKey)
const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))
app.use(expressLayouts)
app.use(require('body-parser').urlencoded({
    extended: false
}))

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

app.get('payment-success', (req, res) => {
    res.render('payment-success.ejs', {
        active: null,
        email: 'name@example.com'
    })
})

app.get('payment-fail', (req, res) => {
    res.render('payment-fail.ejs', {
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
            res.status(500).redirect('/');
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

app.listen(PORT, () => {
    console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
})