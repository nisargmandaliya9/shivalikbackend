const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')

const leaveAssignmentSchema = new Schema({
    branch_id: { type: Schema.Types.ObjectId, ref: 'branchs' },
    department_id: { type: Schema.Types.ObjectId, ref: 'departments' },
    leave_group_id: { type: Schema.Types.ObjectId, ref: 'leavegroups' },
    year: {
        type: Number,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const LeaveAssignmentsModel = DBConnect.model('leaveassignments', leaveAssignmentSchema)

module.exports = LeaveAssignmentsModel