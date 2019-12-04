const express = requires('express')
const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.listen(13000)