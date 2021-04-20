var express = require('express')
var router = express.Router()

const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const availableLanguages = require('../availableLanguages')
const getChallengeCode = require('./getChallengeCode')

// 솔루션 등록
router.post('/solutions', async (req, res) => {
    console.log('솔루션 등록 요청')
    const { userId } = req;

    // 로그인이 되었는지 검사 -> 무인증
    if (!userId) {
        console.log('401');
        res.json({status: 401});
        return;
    }

    // 생성 시도 -> 서버실패 or 데이터결함
    const solution = {}
    Object.assign(solution, req.body)

    // 솔루션에 대응하는 문제를 가져온다.
    let parentProblem
    try {
        parentProblem = await Problem.findOne({ key: solution.problemKey })
    }
    catch (err) {
        console.log('500');
        res.json({status: 500});
        return
    }

    if (!parentProblem) {
        // 대응하는 문제가 없다!
        console.log('400')
        res.json({status: 400});
        return
    }

    // 렝귀지 유효성 검사
    if (!availableLanguages.includes(solution.language)) {
        console.log('400')
        res.json({status: 400});
        return
    }

    solution.ownerId = req.userId
    solution.uploadTime = Date.now()
    solution.state = 0
    solution.testcaseHitCount = 0
    solution.testcaseSize = parentProblem.testcases.length
    solution.maxTime = 0
    solution.maxMemory = 0
    solution.judgeError = ''
    solution.problemVersion = parentProblem.version

    try {
        solution = await Solution.create(solution);
    }
    catch (err) {

        if (err._message === 'Solution validation failed') {
            console.error(err)
            console.log('400')
            res.json({status: 400});
            return
        }

        console.error(err)
        console.log('500')
        res.json({status: 500});
        return;
    }

    if (!problem) {
        console.log('500')
        res.json({status: 500});
        return;
    }

    console.log('200')
    res.json({status: 200, solution});
    return;
})

// 단일 솔루션 조회
// 단일 솔루션 상세 조회
router.get('/solutions/:key', async (req, res) => {
    console.log(`솔루션(${req.params.key}) 조회 요청`)

    try {
        const solution = await Solution.findOne({ key: req.params.key }).lean()
        if (!solution) {
            console.log('404')
            res.json({status: 404});
            return;
        }

        if (solution.ownerId !== req.userId && await getChallengeCode(solution.problemKey, req.userId) !== 1) {
            solution.sourceCode = '';
            solution.judgeError = '';
        }

        console.log('200')
        res.json({status: 200, solution});
        return;
    }
    catch (err) {
        console.error(err)
        console.log('500')
        res.json({status: 500});
        return;
    }
})

// 솔루션 리스트 조회: 정렬, 필터
router.get('/solutions', async (req, res) => {
    console.log('솔루션 리스트 조회 요청')

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
                solution.judgeError = undefined;
            }
        }
        const totalCount = await Solution.count({})

        console.log('200');
        res.json({ status: 200, solutions, totalCount })
    }
    catch (err) {
        console.error(err)
        console.log('500')
        res.json({status: 500});
        return;
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
                solution.judgeError = undefined;
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
