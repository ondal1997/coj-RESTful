var express = require('express')
var router = express.Router()

const Solution = require('../models/Solution')

// TODO : 그냥 다 보여주면 안됨. 수정하셈.
router.get('/', async (req, res) => {
    res.json(await Solution.find())
})

router.post('/', async (req, res) => {
    try {
        await new Solution(req.body).save()
        res.json({ok: true})
    }
    catch (err) {
        res.json({ok: false})
    }
})

router.get('/:id', async (req, res) => {
    try {
        res.json(await Solution.findById(req.params.id))
    }
    catch (err) {
        res.json({ok: false})
    }
})

module.exports = router
