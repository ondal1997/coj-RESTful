var express = require('express')
var router = express.Router()

const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const getChallengeCode = require('./getChallengeCode')

// 문제 등록 : 교원만 가능함
router.post('/problems', async (req, res) => {
    console.log('문제 등록')

    console.log(req.userId);
    const { userId } = req

    const problemBuilder = {}
    Object.assign(problemBuilder, req.body)
    console.log(req.body)

    problemBuilder.ownerId = userId;
    problemBuilder.uploadTime = Date.now()
    problemBuilder.version = 0

    // 시간 제한, 메모리 제한의 범위 검사
    console.log(problemBuilder)
    if (
        !Number.isInteger(Number.parseInt(problemBuilder.timeLimit)) || !Number.isInteger(Number.parseInt(problemBuilder.memoryLimit))
    ) {
        console.log('post problems : 시간 및 메모리 제한 범위 이상1')
        res.sendStatus(400)
        return
    }

    if (
        problemBuilder.timeLimit < 200 || problemBuilder.timeLimit > 5000 ||
        problemBuilder.memoryLimit < 128 || problemBuilder.memoryLimit > 512
    ) {
        console.log('post problems : 시간 및 메모리 제한 범위 이상2')
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
        console.error(err)
        res.sendStatus(400)
        return
    }

    // db에 저장
    try {
        await problem.save()
        console.log('post problems : OK')
        res.json({ ok: true })
    }
    catch (err) {

        if (err._message === 'Problem validation failed') {
            console.log('post problems : 잘못된 스키마')
            console.error(err)
            res.sendStatus(400)
            return
        }

        console.error(err)
        res.sendStatus(500)
    }
})

// 문제 조회 : 권한등급에 따른 차별적조회
router.get('/problems/:key', async (req, res) => {
    console.log('문제 개별 조회')
    console.log(req.params.key)

    try {
        const problem = await Problem.findOne({ key: req.params.key }).lean();
        problem.testcases = undefined;
        problem.challengeCode = await getChallengeCode(problem.key, req.userId);
        problem.submitCount = await Solution.count({ problemKey: problem.key });
        problem.solvedCount = await Solution.count({ problemKey: problem.key, state: 2 });
        if (problem) {
            console.log(typeof problem.uploadTime)
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
    console.log('문제 리스트 조회')

    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count) || 0

        let title = req.query.title || ''
        let category = req.query.category || ''

        title = [...title].join('_');
        title = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        title = title.replace(/_/g, '\\s*');

        category = [...category].join('_');
        category = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        category = category.replace(/_/g, '\\s*');

        let option = category ? {
            title: { $regex: title, $options: 'ix' },
            categories: { $regex: category, $options: 'ix' },
        } : {
            title: { $regex: title, $options: 'ix' },
        }

        const problems = await Problem.find(option).sort({ uploadTime: -1 }).skip(pos).limit(count).lean()
        for (const problem of problems) {
            problem.testcases = undefined;
            problem.challengeCode = await getChallengeCode(problem.key, req.userId);
            problem.submitCount = await Solution.count({ problemKey: problem.key });
            problem.solvedCount = await Solution.count({ problemKey: problem.key, state: 2 });
        }
        const totalCount = await Problem.count(option);

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
        const problems = await Problem.find({ ownerId: req.params.userId }, {}, option).lean()
        for (const problem of problems) {
            problem.testcases = undefined;
            problem.challengeCode = await getChallengeCode(problem.key, req.userId);
            problem.submitCount = await Solution.count({ problemKey: problem.key });
            problem.solvedCount = await Solution.count({ problemKey: problem.key, state: 2 });
        }
        const totalCount = await Problem.count({ ownerId: req.params.userId })

        res.json({ problems, totalCount })
    }
    catch (err) {
        console.error(err)
        res.sendStatus(500)
    }
})

// 카테고리로 문제 조회 (미완)

module.exports = router
