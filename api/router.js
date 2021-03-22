var express = require('express')
var router = express.Router()

router.use('/problems', require('./problems'))
router.use('/solutions', require('./solutions'))

module.exports = router
