var express = require('express')
var router = express.Router()

const Problem = require('../models/Problem')
const Solution = require('../models/Solution')

const availableLanguages = require('../availableLanguages')
const getChallengeCode = require('./getChallengeCode')

function getLevelScore(level) {
    switch (level) {
      case 1:
        return 3;
      case 2:
        return 5;
      case 3:
        return 10;
      case 4:
        return 25;
      case 5:
        return 75;
      case 6:
        return 300;
      case 7:
        return 1500;
      case 8:
        return 9000;
      case 9:
        return 48000;
      case 0:
      default:
        return 3;
    }
  }

// user page
router.get('/problemNumbers', async (req, res) => {
    console.log('GET problemNumbers');
    const { id } = req.query;

    if (!id) {
        console.log('400');
        res.json({ status: 400 });
        return;
    }

    let solutions;
    try {
        solutions = await Solution.find({ ownerId: id }).lean();
    } catch (err) {
        console.error(err);
        res.json({ status: 500 });
        return;
    }

    const acs = new Set();
    const all = new Set();
    const countsOfState = {};
    solutions.forEach((solution) => {
        if (solution.state == 2) {
            acs.add(solution.problemKey);
        }
        all.add(solution.problemKey);

        if (!countsOfState[solution.state]) {
            countsOfState[solution.state] = 0;
        }
        countsOfState[solution.state]++;
    });
    
    for (const value of acs) {
        all.delete(value);
    }
    const accepted = Array.from(acs);
    const notAccepted = Array.from(all);

    let score = 0;
    for (const key of accepted) {
        let problem;
        try {
            problem = await Problem.findOne({ key }).lean();
        } catch (err) {
        }
        const level = problem ? problem.level || 0 : 0;
        score += getLevelScore(level || 0);
    };

    accepted.sort();
    notAccepted.sort();

    console.log('200')
    res.json({status: 200, accepted, notAccepted, countsOfState, score});
});

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
    let solution = {}
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
    solution.judgeError = 'no error'
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

    if (!solution) {
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

function byteLength(str) {
    // returns the byte length of an utf8 string
    var s = str.length;
    for (var i=str.length-1; i>=0; i--) {
      var code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) s++;
      else if (code > 0x7ff && code <= 0xffff) s+=2;
      if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
  }

// 솔루션 리스트 조회: 정렬, 필터
router.get('/solutions', async (req, res) => {
    console.log('솔루션 리스트 조회 요청')

    try {
        const pos = Number.parseInt(req.query.pos) || 0
        const count = Number.parseInt(req.query.count)

        let problemKey = req.query.problemKey || ''
        let ownerId = req.query.ownerId || ''
        let targetState = req.query.state || ''

        const option = {
            sort: { uploadTime: -1 }, skip: pos
        }
        if (count) {
            option.limit = count
        }
        let query = {};
        if (problemKey) {
            query.problemKey = problemKey;
        }
        if (ownerId) {
            query.ownerId = ownerId;
        }
        if (targetState) {
            query.state = targetState;
        }
        const solutions = await Solution.find(query, {}, option).lean()
        for (const solution of solutions) {
            solution.accessable = true;
            solution.byteLength = byteLength(solution.sourceCode);
            if (solution.ownerId !== req.userId && await getChallengeCode(solution.problemKey, req.userId) !== 1) {
                solution.accessable = false;
                solution.sourceCode = undefined;
                solution.judgeError = undefined;
            }
        }
        const totalCount = await Solution.count(query)

        console.log('200');
        res.json({ status: 200, solutions, totalCount })
        return;
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
    console.log('특정 문제의 솔루션 리스트 조회')

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
            solution.accessable = true;
            solution.byteLength = byteLength(solution.sourceCode);
            if (solution.ownerId !== req.userId && await getChallengeCode(solution.problemKey, req.userId) !== 1) {
                solution.accessable = false;
                solution.sourceCode = undefined;
                solution.judgeError = undefined;
            }
        }
        const totalCount = await Solution.count({ problemKey: req.params.problemKey })

        console.log('200');
        res.json({ status: 200, solutions, totalCount })
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
