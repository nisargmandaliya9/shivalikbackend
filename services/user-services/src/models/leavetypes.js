const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js');

const leaveTypeSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    applyOnHoliday: {
        type: Boolean,
        default: false
    },
    applyOnPastDays: {
        type: Boolean,
        default: false
    },
    applyBeforeDays: {
        type: Number,
        default: 0
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

const LeaveTypeModel = DBConnect.model('leavetypes', leaveTypeSchema);

module.exports = LeaveTypeModel;