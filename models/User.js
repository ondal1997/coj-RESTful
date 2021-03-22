const mongoose = require('mongoose')

// TODO: index 배정
module.exports = mongoose.model('User', {
    id: { type: String, required: true, index: true }
})
