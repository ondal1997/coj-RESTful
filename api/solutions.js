var express = require('express')
var router = express.Router()

const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const availableLanguages = require('../availableLanguages')
const getChallengeCode = require('./getChallengeCode')

// 솔루션 등록
// 로그인 되었는지 검사
// 생성 시도 -> 서버실패 or 데이터결함
router.post('/solutions', async (req, res) => {
    console.log('솔루션 등록')

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

    solutionBuilder.ownerId = req.userId
    solutionBuilder.uploadTime = Date.now()
    solutionBuilder.state = 0
    solutionBuilder.testcaseHitCount = 0
    solutionBuilder.testcaseSize = parentProblem.testcases.length
    solutionBuilder.maxTime = 0
    solutionBuilder.maxMemory = 0
    solutionBuilder.judgeError = 'no errer'
    solutionBuilder.problemVersion = parentProblem.version

    // 전체적인 스키마 검사
    let solution
    try {
        solution = new Solution(solutionBuilder)
    }
    catch (err) {
        console.log('post solutions : 잘못된 스키마')
        console.errer(err)
        res.sendStatus(400)
        return
    }

    // db에 저장
    try {
        await solution.save()
        console.log('post solutons : OK')
        res.json(solution)
    }
    catch (err) {

        if (err._message === 'Solution validation failed') {
            console.log('post solutions : 잘못된 스키마')
            console.error(err)
            res.sendStatus(400)
            return
        }

        console.error(err)
        res.sendStatus(500)
    }
})

// 단일 솔루션 조회
// 단일 솔루션 상세 조회
router.get('/solutions/:key', async (req, res) => {
    console.log('솔루션 개별 조회')

    try {
        const solution = await Solution.findOne({ key: req.params.key }).lean()

        if (solution.ownerId !== req.userId && await getChallengeCode(solution.problemKey, req.userId) !== 1) {
            solution.sourceCode = undefined;
        }

        if (solution) {
            console.log(solution)
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

// 솔루션 리스트 조회: 정렬, 필터
router.get('/solutions', async (req, res) => {
    console.log('솔루션 리스트 조회')

    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count)

        const option = {
            sort: { uploadTime: -1 }, skip: pos
        }
        if (count) {
            option.limit = count
        }
        const solutions = await Solution.find({}, {}, option).lean()
        for (const solution of solutions) {
            if (solution.ownerId !== req.userId && await getChallengeCode(solution.problemKey, req.userId) !== 1) {
                solution.sourceCode = undefined;
            }
        }
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
    console.log('문제의 솔루션들 조회')

    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count)

        const option = {
            sort: { uploadTime: -1 }, skip: pos
        }
        if (count) {
            option.limit = count
        }
        const solutions = await Solution.find({ problemKey: req.params.problemKey }, {}, option).lean()
        for (const solution of solutions) {
            if (solution.ownerId !== req.userId && await getChallengeCode(solution.problemKey, req.userId) !== 1) {
                solution.sourceCode = undefined;
            }
        }
        const totalCount = await Solution.count({ problemKey: req.params.problemKey })

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
        const solutions = await Solution.find({ ownerId: req.params.userId }, {}, option).lean()
        for (const solution of solutions) {
            if (solution.ownerId !== req.userId && await getChallengeCode(solution.problemKey, req.userId) !== 1) {
                solution.sourceCode = undefined;
            }
        }
        const totalCount = await Solution.count({ ownerId: req.params.userId })

        res.json({ solutions, totalCount })
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
    }
})

module.exports = router
