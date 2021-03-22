alert('hello')

const problem = {
    title: 'A+B+C',
    description: 'print A+B+C',
    categories: ['재귀', '쉬운문제'],
    timeLimit: 5000,
    memoryLimit: 128,
    examples: [],
    testcases: [
        {
            input: `3
4
7
10`,
            output: `7
44
274
`
        },
        {
            input: `3
4
7
10`,
            output: `7
44
274
`
        }
    ]
}


// fetch('http://localhost:3000/api/problems', {
//     method: 'GET'
// }).then((res) => {
//     console.log(res.status)
//     return res.json()
// }).then((res) => {
//     console.log(res)
// })


fetch('http://localhost:3000/api/problems', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(problem)
}).then((res) => {
    console.log(res.status)
})
