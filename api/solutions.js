var express = require('express')
var router = express.Router()

const Problem = require('../models/Problem')
const Solution = require('../models/Solution')

const languages = ['python3', 'c', 'c++']

// TODO : 그냥 다 보여주면 안됨. 수정하셈.
router.get('/', async (req, res) => {
    res.json(await Solution.find())
})

router.post('/', async (req, res) => {
    const solutionBuilder = {}
    Object.assign(solutionBuilder, req.body)

    // 솔루션에 대응하는 문제를 가져온다.
    let parentProblem
    try {
        parentProblem = await Problem.findOne({ key: solutionBuilder.problemKey })
    }
    catch (err) {
        console.error(err)
        req.sendStatus(500)
        return
    }

    if (!parentProblem) {
        console.log('post solutions: 대응하는 문제 없음')
        req.sendStatus(400)
        return
    }

    // 렝귀지 유효성 검사
    if (!languages.contains(solutionBuilder.language)) {
        console.log('post solutions: 지원하지 않는 언어')
        req.sendStatus(400)
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

router.get('/:key', async (req, res) => {
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
        res.sendStatus(500)
    }
})

module.exports = router
