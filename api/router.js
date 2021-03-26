var express = require('express')
var router = express.Router()

const availableLanguages = require('../availableLanguages')
router.get('/availableLanguages', (req, res) => {
    res.json(availableLanguages)
})
router.use(require('./problems'))
router.use(require('./solutions'))

module.exports = router
