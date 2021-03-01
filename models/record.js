'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var RecordSchema = Schema({
    time: {
        type: Date,
        default: Date.now
    },
    input: [Schema.Types.Mixed],
    output: [Schema.Types.Mixed],
});
module.exports = mongoose.model('Record', RecordSchema)