const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')

const employeeLeaveBalanceSchema = new Schema({
    employee_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    leave_type_id: { type: Schema.Types.ObjectId, ref: 'leavetypes', required: true },
    total_leaves: { type: Number, required: true },
    used_leaves: { type: Number, default: 0 },
    remaining_leaves: { type: Number },
    year: { type: Number, required: true },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

employeeLeaveBalanceSchema.pre('save', function(next) {
    this.remaining_leaves = this.total_leaves - this.used_leaves;
    next();
});

const EmployeeLeaveBalancesModel = DBConnect.model('employeeleavebalances', employeeLeaveBalanceSchema)

module.exports = EmployeeLeaveBalancesModel