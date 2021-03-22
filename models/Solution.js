const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
autoIncrement.initialize(mongoose.connection)

// TODO: index 배정
const SolutionSchema = new mongoose.Schema({
    key: { type: Number, required: true },
    ownerId: { type: String, required: true, index: true },
    uploadTime: { type: Date, required: true },

    state: { type: String, required: true },
    testcaseHitCount: { type: Number, required: true },
    testcaseSize: { type: Number, required: true },

    problemKey: { type: Number, required: true, index: true },
    problemVersion: { type: Number, required: true },
    language: { type: String, require: true },
    sourceCode: { type: String, required: true }
})

SolutionSchema.plugin(autoIncrement.plugin, {
    model: 'Solution',
    field: 'key',
    startAt: 1000,
    incrementBy: 1
})

module.exports = mongoose.model('Solution', SolutionSchema)
