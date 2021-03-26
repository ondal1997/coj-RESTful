var express = require('express')
var router = express.Router()

const Problem = require('../models/Problem')

// 문제 등록
 router.post('/problems', async (req, res) => {
    // req.param.id
    // req.param.auth

    const problemBuilder = {}
    Object.assign(problemBuilder, req.body)

    problemBuilder.ownerId = 'tempUserId'
    problemBuilder.uploadTime = Date.now()
    problemBuilder.version = 0

    // 시간 제한, 메모리 제한의 범위 검사
    if (
        !Number.isInteger(problemBuilder.timeLimit) || !Number.isInteger(problemBuilder.memoryLimit) ||
        problemBuilder.timeLimit < 200 || problemBuilder.timeLimit > 5000 ||
        problemBuilder.memoryLimit < 128 || problemBuilder.memoryLimit > 512
    ) {
        console.log('post problems : 시간 및 메모리 제한 범위 이상')
        res.sendStatus(400)
        return
    }

    // 전체적인 스키마 검사
    let problem
    try {
        problem = new Problem(problemBuilder)
    }
    catch (err) {
        console.log('post problems : 잘못된 스키마')
        res.sendStatus(400)
        return
    }

    // db에 저장
    try {
        await problem.save()
        console.log('post problems : OK')
        res.sendStatus(200)
    }
    catch (err) {

        if (err._message === 'Problem validation failed') {
            console.log('post problems : 잘못된 스키마')
            res.sendStatus(400)
            return
        }

        console.error(err)
        res.sendStatus(500)
    }
})

// 문제 조회
router.get('/problems/:key', async (req, res) => {
    try {
        const problem = await Problem.findOne({ key: req.params.key })

        if (problem) {
            res.json(problem)
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

// 문제들 조회
router.get('/problems', async (req, res) => {
    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count)

        const option = {
            sort: { uploadTime: -1 }, skip: pos
        }
        if (count) {
            option.limit = count
        }
        const problems = await Problem.find({}, {}, option)
        const totalCount = await Problem.count({})

        res.json({ problems, totalCount })
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
    }
})

// 사용자의 문제들 조회
router.get('/users/:userId/problems', async (req, res) => {
    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count)

        const option = {
            sort: { uploadTime: -1 }, skip: pos
        }
        if (count) {
            option.limit = count
        }
        const problems = await Problem.find({ ownerId: req.params.userId }, {}, option)
        const totalCount = await Problem.count({})

        res.json({ problems, totalCount })
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
    }
})

// 카테고리로 문제 조회
router.post('/problemsWithCategories', async (req, res) => {
    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count)

        const option = {
            sort: { uploadTime: -1 }, skip: pos
        }
        if (count) {
            option.limit = count
        }
        const problems = await Problem.find({ /* 특정 카테고리를 가지고 있는가? */ }, {}, option)
        const totalCount = await Problem.count({})

        res.json({ problems, totalCount })
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
    }
})

module.exports = router
