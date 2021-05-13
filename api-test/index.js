const problem = {
    title: 'A+B+C',
    description: 'print A+B+C',
    categories: ['재귀', '쉬운문제'],
    timeLimit: 5000,
    memoryLimit: 128,
    examples: [],
    testcases: [
        {
            input: `3 4 0`,
            output: `7`
        },
        {
            input: `1 2 3`,
            output: `6`,
        }
    ]
}

const solution = {
    problemKey: '1003',
    language: 'python3',
    sourceCode: `a, b, c = map(int, input().split())
print(a+b)
`
}


// fetch('http://localhost:3000/api/problems', {
//     method: 'GET'
// }).then((res) => {
//     console.log(res.status)
//     return res.json()
// }).then((res) => {
//     console.log(res)
// })

// fetch('http://192.168.0.100:3000/api/problems/1058?userId=손님', {
//     method: 'DELETE'
// }).then((res) => res.json()).then((res) => console.log(res));

// fetch('http://127.0.0.1:3000/api/problems?userId=ondal1997', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(problem)
// }).then((res) => res.json()).then((res) => console.log(res));

// fetch('http://127.0.0.1:3000/api/problems/1004?userId=ondal1997', {
//     method: 'PUT',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(problem)
// }).then((res) => res.json()).then((res) => console.log(res));

// fetch('http://127.0.0.1:3000/api/problems/1014?userId=ondal1997')
// .then((res) => res.json()).then((res) => console.log(res));
