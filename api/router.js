var express = require('express')
var router = express.Router()

const availableLanguages = require('../availableLanguages')
router.get('/availableLanguages', (req, res) => {
    res.json(availableLanguages)
})
router.use('/problems', require('./problems'))
router.use('/solutions', require('./solutions'))

module.exports = router
