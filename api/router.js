var express = require('express')
var router = express.Router()

const availableLanguages = require('../availableLanguages')
router.get('/availableLanguages', (req, res) => {
    res.json(availableLanguages)
})
router.get('/auth', (req, res) => {
    if (req.userId === 'null') {
        req.json({authenticated: false});
    }
    res.json({authenticated: true, id: req.userId});
})
router.use(require('./problems'))
router.use(require('./solutions'))

module.exports = router
