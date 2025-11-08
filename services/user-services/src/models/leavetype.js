const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const LeaveType = mongoose.model('leavetypes', leaveTypeSchema);

module.exports = LeaveType;