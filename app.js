const http = require('http')
const express = require('express')
const mongoose = require('mongoose')

const multer = require('multer')
const uploadPath = '/home/coders/coj-fe/build/img/';
const upload = multer({ dest: uploadPath, limits: { fileSize: 5 * 1024 * 1024 } })

const apiRouter = require('./api/router')

const app = express()
const port = process.env.PORT | 3000

const connection = mongoose.connect('mongodb://localhost:27017/judge0326_0', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    next()
})
app.use((req, res, next) => {
    console.log('http open');
    next();
})
app.post('/upload', upload.single('upload'), function(req, res){
    res.json({
        url: 'http://192.168.0.100:3001/img/' + req.file.filename
    });
});
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/api', apiRouter)

http.createServer(app).listen(port)
