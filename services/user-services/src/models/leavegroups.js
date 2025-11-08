const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')

const leaveGroupSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    leave_type_id: { type: Schema.Types.ObjectId, ref: 'leavetypes', required: true },
    allocation_type: { type: String, enum: ['Yearly', 'Monthly'] },
    paid_leaves: Number,
    leave_formula: { type: String, enum: ['Half Day', 'Full Day'] },
    max_use_in_month: Number,
    one_day_leave_rule: String,
    year_end_policy: {
        type: String,
        enum: ['PayoutManual', 'PayoutAuto', 'CarryForwardManual', 'CarryForwardAuto', 'Reset']
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

const LeaveGroupsModel = DBConnect.model('leavegroups', leaveGroupSchema)

module.exports = LeaveGroupsModel