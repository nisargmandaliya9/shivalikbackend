const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')

const holidayGroupAssignmentSchema = new Schema({
    holiday_group_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'holidaygroups', 
        required: true 
    },
    branch_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'branchs', 
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

const HolidayGroupAssignmentModel = DBConnect.model('holidaygroupassignments', holidayGroupAssignmentSchema)

module.exports = HolidayGroupAssignmentModel