const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')

const departmentSchema = new Schema({
    name: { type: String, required: true },
    branch_id: { type: Schema.Types.ObjectId, ref: 'branchs', required: true },
    createdAt: {
        type: Date,
        index: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        required: false,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

const DepartmentsModel = DBConnect.model('departments', departmentSchema)

module.exports = DepartmentsModel
