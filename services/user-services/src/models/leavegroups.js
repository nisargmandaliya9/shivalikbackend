const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')

const leaveGroupSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    leave_types: [
        {
            leave_type_id: { type: Schema.Types.ObjectId, ref: 'leavetypes', required: true },
            paid_leaves: { type: Number, default: 0 }
        }
    ],
    allocation_type: { type: String, enum: ['Yearly', 'Monthly'] },
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