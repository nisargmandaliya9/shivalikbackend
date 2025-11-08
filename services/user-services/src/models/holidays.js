const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')

const holidaysSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    date: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const HolidaysModel = DBConnect.model('holidays', holidaysSchema)

module.exports = HolidaysModel