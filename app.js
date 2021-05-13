const http = require('http')
const express = require('express')
const mongoose = require('mongoose')

const apiRouter = require('./api/router')

const app = express()
const port = process.env.PORT | 3000

const connection = mongoose.connect('mongodb://localhost:27017/judge0513_0', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    res.header('Access-Control-Allow-Methods', "*")
    next()
})
app.use((req, res, next) => {
    req.userId = req.query.userId;
    next();
})
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/api', apiRouter)

http.createServer(app).listen(port)
