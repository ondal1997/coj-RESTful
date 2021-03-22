const http = require('http')
const express = require('express')
const mongoose = require('mongoose')

const apiRouter = require('./api/router')

const app = express()
const port = process.env.PORT | 3000

const connection = mongoose.connect('mongodb://localhost:27017/judge0322_1', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    next()
})
app.use(express.json())
app.use('/api', apiRouter)

http.createServer(app).listen(port)
