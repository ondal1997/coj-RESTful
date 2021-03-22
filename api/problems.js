var express = require('express')
var router = express.Router()

const Problem = require('../models/Problem')

/**
 * GET ${serverAddress}/api/problems
 */
router.get('/', async (req, res) => {
    try {
        res.json(await Problem.find())
    }
    catch (err) {
        res.sendStatus(500)
    }
})

/**
 * POST ${serverAddress}/api/problems
 */
// TODO: 내부 스키마 검증이  500번->400번..
router.post('/', async (req, res) => {
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
        console.log('시간 및 메모리 제한 범위 이상')
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
        res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

/**
 * GET ${serverAddress}/api/problems/:key
 */
router.get('/:key', async (req, res) => {
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
        res.sendStatus(500)
    }
})

module.exports = router
