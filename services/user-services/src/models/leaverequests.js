const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')

const leaveRequestSchema = new Schema({
    employee_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'users', 
        required: true 
    },
    leave_type_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'leavetypes', 
        required: true 
    },
    manager_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'users', 
        required: true 
    },
    leave_taken: { 
        type: Number, 
        required: true,
    },
    date_applied: { 
        type: Date, 
        default: Date.now 
    },
    leave_date: { 
        type: Date, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    reason: { 
        type: String, 
        required: true 
    },
    rejection_reason: { 
        type: String 
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const LeaveRequestsModel = DBConnect.model('leaverequests', leaveRequestSchema)

module.exports = LeaveRequestsModel