const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')

const holidayGroupsSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    holiday_id: [
        {
            type: Schema.Types.ObjectId,
            ref: 'holidays'
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const HolidayGroupsModel = DBConnect.model('holidaygroups', holidayGroupsSchema)

module.exports = HolidayGroupsModel