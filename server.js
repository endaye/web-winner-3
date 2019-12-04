// ref: https://www.youtube.com/watch?v=mI_-1tbIXQI

const express = requires('express')
const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.listen(13000)