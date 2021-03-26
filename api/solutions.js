var express = require('express')
var router = express.Router()

const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const availableLanguages = require('../availableLanguages')

// 솔루션 등록
router.post('/solutions', async (req, res) => {
    const solutionBuilder = {}
    Object.assign(solutionBuilder, req.body)

    // 솔루션에 대응하는 문제를 가져온다.
    let parentProblem
    try {
        parentProblem = await Problem.findOne({ key: solutionBuilder.problemKey })
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
        return
    }

    if (!parentProblem) {
        console.log('post solutions: 대응하는 문제 없음')
        res.sendStatus(400)
        return
    }

    // 렝귀지 유효성 검사
    if (!availableLanguages.includes(solutionBuilder.language)) {
        console.log('post solutions: 지원하지 않는 언어')
        res.sendStatus(400)
        return
    }

    solutionBuilder.ownerId = 'tempUserId'
    solutionBuilder.uploadTime = Date.now()
    solutionBuilder.state = 'idle'
    solutionBuilder.testcaseHitCount = 0
    solutionBuilder.testcaseSize = parentProblem.testcases.length
    solutionBuilder.problemVersion = parentProblem.version

    // 전체적인 스키마 검사
    let solution
    try {
        solution = new Solution(solutionBuilder)
    }
    catch (err) {
        console.log('post problems : 잘못된 스키마')
        res.sendStatus(400)
        return
    }

    // db에 저장
    try {
        await solution.save()
        console.log('post solutons : OK')
        res.sendStatus(200)
    }
    catch (err) {

        if (err._message === 'Solution validation failed') {
            console.log('post solutions : 잘못된 스키마')
            res.sendStatus(400)
            return
        }

        console.error(err)
        res.sendStatus(500)
    }
})

// 솔루션 조회
router.get('/solutions/:key', async (req, res) => {
    try {
        const solution = await Solution.findOne({ key: req.params.key })

        if (solution) {
            res.json(solution)
        }
        else {
            res.sendStatus(404)
        }
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
    }
})

// 솔루션들 조회
router.get('/solutions', async (req, res) => {
    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count)

        const option = {
            sort: { uploadTime: -1 }, skip: pos
        }
        if (count) {
            option.limit = count
        }
        const solutions = await Solution.find({}, {}, option)
        const totalCount = await Solution.count({})

        res.json({ solutions, totalCount })
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
    }
})

// 문제에 대응하는 솔루션들 조회
router.get('/problems/:problemKey/solutions', async (req, res) => {
    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count)

        const option = {
            sort: { uploadTime: -1 }, skip: pos
        }
        if (count) {
            option.limit = count
        }
        const solutions = await Solution.find({ problemKey: req.params.problemKey }, {}, option)
        const totalCount = await Solution.count({})

        res.json({ solutions, totalCount })
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
    }
})

// 사용자의 솔루션들 조회
router.get('/users/:userId/solutions', async (req, res) => {
    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count)

        const option = {
            sort: { uploadTime: -1 }, skip: pos
        }
        if (count) {
            option.limit = count
        }
        const solutions = await Solution.find({ ownerId: req.params.userId }, {}, option)
        const totalCount = await Solution.count({})

        res.json({ solutions, totalCount })
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
    }
})

module.exports = router
