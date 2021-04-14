const Solution = require('../models/Solution');

/*

0 : 없음
1 : 맞은 문제
-1 : 실패한 문제

*/

const getChallengeCode = async (problemKey, userId) => {
    const solutions = await Solution.find({problemKey, ownerId: userId}).lean()

    let res = 0;

    for (let i = 0; i < solutions.length; i++) {
        if (solutions[i].state == 2) {
            return 1;
        }

        if (solutions[i].state > 2 && solutions[i].state < 8) {
            res = -1;
        }
    }

    return res;
}

module.exports = getChallengeCode;
