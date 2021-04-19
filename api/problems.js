var express = require('express')
var router = express.Router()

const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const getChallengeCode = require('./getChallengeCode')

router.delete('/problems/:key', async (req, res) => {
    console.log('문제 삭제 요청');
    const { userId } = req;

    // 로그인이 되었는지 검사 -> 무인증
    if (!userId) {
        console.log('401');
        res.json({status: 401});
        return;
    }

    // 자료가 있는지 검사 -> 서버실패 or 무자료
    let problem;
    try {
        problem = await Problem.findOne({key: req.params.key}).lean();
    } catch (error) {
        console.log('500');
        res.json({status: 500});
        return;
    }
    if (!problem) {
        console.log('404');
        res.json({status: 404});
        return;
    }

    // 자기 것이 맞는지 검사 -> 무소유
    if (problem.ownerId !== userId) {
        console.log('403');
        res.json({status: 403});
        return;
    }

    // 삭제 시도 -> (무자료 or) 서버실패
    try {
        await Problem.deleteOne({key: req.params.key});
    } catch (error) {
        console.log('500');
        res.json({status: 500});
        return;
    }
    
    console.log('200');
    res.json({status: 200});
    return;
})

router.put('/problems/:key', async (req, res) => {
    console.log('문제 수정 요청');
    const { userId } = req;

    // 로그인 되었는지 검사
    if (!userId) {
        console.log('401');
        res.json({status: 401});
        return;
    }

    // 자료가 있는지 검사
    let problem;
    try {
        problem = await Problem.findOne({key: req.params.key}).lean();
    } catch (error) {
        console.log('500');
        res.json({status: 500});
        return;
    }
    if (!problem) {
        console.log('404');
        res.json({status: 404});
        return;
    }

    // 자기 것이 맞는지 검사 -> 무소유
    if (problem.ownerId !== userId) {
        console.log('403');
        res.json({status: 403});
        return;
    }

    // 업데이트 시도 -> 무자료 or 서버실패 or 데이터결함
    problem = {}
    Object.assign(problem, req.body)

    try {
        const set = new Set(problem.categories);
        problem.categories = [...set];
    } catch (error) {
        console.log('400');
        res.json({status: 400});
        return
    }

    problem.timeLimit = Number.parseInt(problem.timeLimit);
    problem.memoryLimit = Number.parseInt(problem.memoryLimit);
    if (
        Number.isNaN(problem.timeLimit) || Number.isNaN(problem.memoryLimit)
    ) {
        console.log('400');
        res.json({status: 400});
        return
    }
    if (
        problem.timeLimit < 200 || problem.timeLimit > 5000 ||
        problem.memoryLimit < 128 || problem.memoryLimit > 512
    ) {
        console.log('400');
        res.json({status: 400});
        return
    }

    try {
        problem = await Problem.findOneAndUpdate({key: req.params.key}, { $set: problem, $inc: { version: 1 } }, {new: true}).setOptions({ runValidators: true });
    }
    catch (err) {
        if (err._message === 'Validation failed') {
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
        console.log('404')
        res.json({status: 404});
        return;
    }

    console.log('200')
    res.json({status: 200, problem});
    return;
})

router.post('/problems', async (req, res) => {
    console.log('문제 등록 요청');
    const { userId } = req;
    
    // 로그인 되었는지 검사
    if (!userId) {
        console.log('401');
        res.json({status: 401});
        return;
    }

    // 생성 시도 -> 서버실패 or 데이터결함
    let problem = {}
    Object.assign(problem, req.body)

    problem.ownerId = userId;
    problem.uploadTime = Date.now()
    problem.version = 0

    try {
        const set = new Set(problem.categories);
        problem.categories = [...set];
    } catch (error) {
        console.log('400');
        res.json({status: 400});
        return
    }

    problem.timeLimit = Number.parseInt(problem.timeLimit);
    problem.memoryLimit = Number.parseInt(problem.memoryLimit);
    if (
        Number.isNaN(problem.timeLimit) || Number.isNaN(problem.memoryLimit)
    ) {
        console.log('400');
        res.json({status: 400});
        return
    }
    if (
        problem.timeLimit < 200 || problem.timeLimit > 5000 ||
        problem.memoryLimit < 128 || problem.memoryLimit > 512
    ) {
        console.log('400');
        res.json({status: 400});
        return
    }

    try {
        problem = await Problem.create(problem);
    }
    catch (err) {
        if (err._message === 'Problem validation failed') {
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
    res.json({status: 200, problem});
    return;
})

// 단일 문제 조회
// 자료가 있는지 검사
router.get('/problems/:key', async (req, res) => {
    console.log(`문제(${req.params.key}) 조회 요청`)

    try {
        const problem = await Problem.findOne({ key: req.params.key }, { testcases: 0 }).lean();
        if (!problem) {
            console.log('404')
            res.json({status: 404});
            return;
        }

        problem.challengeCode = await getChallengeCode(problem.key, req.userId);
        problem.submitCount = await Solution.count({ problemKey: problem.key });
        problem.solvedCount = await Solution.count({ problemKey: problem.key, state: 2 });

        console.log('200')
        res.json({status: 200, problem});
        return;
    }
    catch (err) {
        console.error(err)
        console.log('500')
        res.json({status: 500});
        return;
    }
})

// 단일 문제 상세 조회
// 로그인 되어있는지 검사
// 자료가 있는지 검사
// 자기 것이 맞는지 검사
router.get('/problems/:key/all', async (req, res) => {
    console.log(`문제(${req.params.key}) 상세 조회 요청`)
    const { userId } = req;

    // 로그인이 되었는지 검사 -> 무인증
    if (!userId) {
        console.log('401');
        res.json({status: 401});
        return;
    }

    try {
        const problem = await Problem.findOne({ key: req.params.key }).lean();
        if (!problem) {
            console.log('404')
            res.json({status: 404});
            return;
        }

        // 자기 것이 맞는지 검사 -> 무소유
        if (problem.ownerId !== userId) {
            console.log('403');
            res.json({status: 403});
            return;
        }

        problem.challengeCode = await getChallengeCode(problem.key, req.userId);
        problem.submitCount = await Solution.count({ problemKey: problem.key });
        problem.solvedCount = await Solution.count({ problemKey: problem.key, state: 2 });

        console.log('200')
        res.json({status: 200, problem});
        return;
    }
    catch (err) {
        console.error(err)
        console.log('500')
        res.json({status: 500});
        return;
    }
})

// 문제 리스트 조회: 정렬, 필터
// sortBy=property
// sort=1(오름차순) -1(내림차순)
// 
// categorySubString=A 카테고리들 중 하나의 부분문자열로 A이어야한다.
// categorySubString=B 카테고리들 중 하나의 부분문자열로 B이어야한다.
// ..
// titleSubString=C title의 부분문자열로 C이어야한다.
//
// skip 결과 중 생략할 개수
// limit 결과 중 보일 최대 개수
router.get('/problems', async (req, res) => {
    console.log('문제 리스트 조회 요청')

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

        console.log('200');
        res.json({ status: 200, problems, totalCount })
        return;
    }
    catch (err) {
        console.error(err)
        console.log('500')
        res.json({status: 500});
        return;
    }
})

module.exports = router
