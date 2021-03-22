const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
autoIncrement.initialize(mongoose.connection)

// TODO: index 배정
const ProblemSchema = new mongoose.Schema({
    key: { type: Number, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    uploadTime: { type: Date, required: true },
    version: { type: Number, required: true },

    title: { type: String, required: true },
    description: { type: String, required: true },
    categories: [
        {
            type: String
        }
    ],
    timeLimit: { type: Number, require: true },
    memoryLimit: { type: Number, require: true },
    examples: [
        {
            input: {
                type: String,
                required: true
            },
            output: {
                type: String,
                required: true
            }
        }
    ],
    testcases: [
        {
            input: {
                type: String,
                required: true
            },
            output: {
                type: String,
                required: true
            }
        }
    ]
})

ProblemSchema.plugin(autoIncrement.plugin, {
    model: 'Problem',
    field: 'key',
    startAt: 1000,
    incrementBy: 1
})

module.exports = mongoose.model('Problem', ProblemSchema)
