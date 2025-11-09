const { check, param } = require('express-validator');
const UsersModel = require('../models/users');

// exports.testUserApi = [
//     check('name').not().isEmpty().withMessage('Name is requied'),
// ];

exports.loginApi = [
    check('phone').not().isEmpty().withMessage('Phone is requied'),
];

exports.verifyOTP = [
    check('phone').not().isEmpty().withMessage('Phone is requied'),
    check('otpcode').not().isEmpty().withMessage('OTP is requied'),
];

exports.logout = [
    check('token').not().isEmpty().withMessage('Token is required'),
];

exports.addLeaveType = [
    check('name').not().isEmpty().withMessage('Name is requied'),
    check('applyOnHoliday').isBoolean().withMessage('Apply on holiday must be a boolean'),
    check('applyOnPastDays').isBoolean().withMessage('Apply on past days must be a boolean'),
    check('isActive').isBoolean().withMessage('isActive must be a boolean'),
];

exports.editLeaveType = [
    check('id').not().isEmpty().withMessage('ID is required'),
];

exports.deleteLeaveType = [
    check('id').not().isEmpty().withMessage('ID is required'),
];

exports.addHoliday = [
    check('name').not().isEmpty().withMessage('Name is requied'),
    check('date').not().isEmpty().withMessage('Date is required'),
    check('description').optional(),
];

exports.editHoliday = [
    check('id').not().isEmpty().withMessage('ID is required'),
];

exports.deleteHoliday = [
    check('id').not().isEmpty().withMessage('ID is required'),
];

exports.addHolidayGroup = [
    check('name').not().isEmpty().withMessage('Name is requied'),
    check('holiday_id').isArray().withMessage('Holiday IDs must be an array')
        .notEmpty().withMessage('At least one holiday ID is required'),
    check('holiday_id.*').isMongoId().withMessage('Each holiday ID must be a valid ID')
];

exports.editHolidayGroup = [
    check('id').not().isEmpty().withMessage('ID is required'),
    check('holiday_id').optional().isArray().withMessage('Holiday IDs must be an array'),
    check('holiday_id.*').optional().isMongoId().withMessage('Each holiday ID must be a valid ID')
];

exports.deleteHolidayGroup = [
    check('id').not().isEmpty().withMessage('ID is required'),
];

exports.assignHolidayGroup = [
    check('holiday_group_id')
        .not().isEmpty().withMessage('Holiday Group ID is required')
        .isMongoId().withMessage('Must be a valid Holiday Group ID'),
    check('branch_id')
        .not().isEmpty().withMessage('Branch ID is required')
        .isMongoId().withMessage('Must be a valid Branch ID'),
];

exports.deleteAssignHolidayGroup = [
    check('id')
        .not().isEmpty().withMessage('ID is required')
        .isMongoId().withMessage('Must be a valid ID'),
];

exports.addLeaveGroup = [
    check('name').not().isEmpty().withMessage('Name is required'),
    check('leave_types').isArray().withMessage('Leave types must be an array')
        .notEmpty().withMessage('At least one leave type is required'),
    check('leave_types.*.leave_type_id').not().isEmpty().withMessage('Leave type ID is required')
        .isMongoId().withMessage('Must be a valid leave type ID'),
    check('leave_types.*.paid_leaves').isInt({ min: 0 }).withMessage('Paid leaves must be a non-negative number'),
    check('allocation_type').isIn(['Yearly', 'Monthly']).withMessage('Invalid allocation type'),
    check('year_end_policy').isIn(['PayoutManual', 'PayoutAuto', 'CarryForwardManual', 'CarryForwardAuto', 'Reset'])
        .withMessage('Invalid year end policy')
];

exports.editLeaveGroup = [
    check('id').not().isEmpty().withMessage('ID is required'),
    check('name').optional(),
    check('leave_types').optional().isArray().withMessage('Leave types must be an array'),
    check('leave_types.*.leave_type_id').optional().isMongoId().withMessage('Must be a valid leave type ID'),
    check('leave_types.*.paid_leaves').optional().isInt({ min: 0 }).withMessage('Paid leaves must be a non-negative number'),
    check('allocation_type').optional().isIn(['Yearly', 'Monthly']).withMessage('Invalid allocation type'),
    check('year_end_policy').optional().isIn(['PayoutManual', 'PayoutAuto', 'CarryForwardManual', 'CarryForwardAuto', 'Reset'])
        .withMessage('Invalid year end policy')
];

exports.deleteLeaveGroup = [
    check('id').not().isEmpty().withMessage('ID is required'),
];

exports.getLeaveAssignmentList = [
    check('year').optional().isInt().withMessage('Year must be a number'),
    check('branch_id').optional().isMongoId().withMessage('Must be a valid branch ID'),
    check('department_id').optional().isMongoId().withMessage('Must be a valid department ID'),
];

exports.addLeaveAssignment = [
    check('branch_id').not().isEmpty().withMessage('Branch ID is required').isMongoId().withMessage('Must be a valid branch ID'),
    check('department_id').not().isEmpty().withMessage('Department ID is required').isMongoId().withMessage('Must be a valid department ID'),
    check('leave_group_id').not().isEmpty().withMessage('Leave Group ID is required').isMongoId().withMessage('Must be a valid leave group ID'),
    check('year').not().isEmpty().withMessage('Year is required').isInt().withMessage('Year must be a valid number'),
];

exports.deleteLeaveAssignment = [
    check('id').not().isEmpty().withMessage('ID is required').isMongoId().withMessage('Must be a valid ID'),
];

exports.getDepartmentList = [
    check('id').not().isEmpty().withMessage('ID is required'),
];

exports.getBranchList = [
    check('id').not().isEmpty().withMessage('ID is required'),
];

exports.getEmployeeList = [
    check('id').not().isEmpty().withMessage('ID is required'),
];

exports.addEmployee = [
    check('name')
        .not().isEmpty().withMessage('Name is required'),

    check('email')
        .isEmail().withMessage('Must be a valid email address')
        .custom(async (value) => {
            const user = await UsersModel.findOne({ email: value, isDeleted: false });
            if (user) {
                return Promise.reject('E-mail already in use');
            }
        }),

    check('phone')
        .not().isEmpty().withMessage('Phone number is required')
        .custom(async (value) => {
            const user = await UsersModel.findOne({ phone: value, isDeleted: false });
            if (user) {
                return Promise.reject('Phone number already in use');
            }
        }),

    check('role')
        .isIn(['Employee', 'Manager', 'HR']).withMessage('Invalid role specified'),

    check('branch_id')
        .not().isEmpty().withMessage('Branch ID is required')
        .isMongoId().withMessage('Must be a valid branch ID'),

    check('department_id')
        .not().isEmpty().withMessage('Department ID is required')
        .isMongoId().withMessage('Must be a valid department ID'),

    check('manager_id')
        .not().isEmpty().withMessage('Manager ID is required')
        .isMongoId().withMessage('Must be a valid Manager ID'),
];

exports.editEmployee = [
    check('id')
        .not().isEmpty().withMessage('ID is required')
        .isMongoId().withMessage('Must be a valid user ID'),
];

exports.deleteEmployee = [
    check('id').not().isEmpty().withMessage('ID is required').isMongoId().withMessage('Must be a valid user ID'),
];

exports.requestLeave = [
    check('id')
        .not().isEmpty().withMessage('ID is required')
        .isMongoId().withMessage('Must be a valid ID'),
    check('leave_type_id')
        .not().isEmpty().withMessage('Leave type is required')
        .isMongoId().withMessage('Must be a valid leave type ID'),
    check('leave_taken')
        .not().isEmpty().withMessage('Leave taken is required'),
    check('from_date')
        .not().isEmpty().withMessage('From date is required')
        .isISO8601().withMessage('Must be a valid date'),
    check('to_date')
        .not().isEmpty().withMessage('To date is required')
        .isISO8601().withMessage('Must be a valid date'),
    check('reason')
        .not().isEmpty().withMessage('Reason is required')
        .isString().withMessage('Reason must be a string')
        .isLength({ min: 3, max: 500 }).withMessage('Reason must be between 3 and 500 characters'),
];

exports.getEmployeeLeaveBalance = [
    check('branch_id')
        .not().isEmpty().withMessage('Branch ID is required')
        .isMongoId().withMessage('Must be a valid branch ID'),
    check('department_id')
        .not().isEmpty().withMessage('Department ID is required')
        .isMongoId().withMessage('Must be a valid department ID'),
    check('year')
        .not().isEmpty().withMessage('Year is required')
        .isInt().withMessage('Year must be a valid number'),
    check('employee_id').optional().isMongoId().withMessage('Must be a valid employee ID'),
    check('leave_type_id').optional().isMongoId().withMessage('Must be a valid leave type ID'),
];

exports.managerLeaveRequests = [
    check('id').not().isEmpty().withMessage('ID is required').isMongoId().withMessage('Must be a valid ID'),
    check('status').optional().isIn(['Pending', 'Approved', 'Rejected']).withMessage('Invalid status filter')
];

exports.approveLeave = [
    check('request_id').not().isEmpty().withMessage('Request ID is required').isMongoId().withMessage('Must be a valid request ID')
];

exports.rejectLeave = [
    check('request_id').not().isEmpty().withMessage('Request ID is required').isMongoId().withMessage('Must be a valid request ID'),
    check('rejection_reason').not().isEmpty().withMessage('Rejection reason is required').isLength({ min: 3 }).withMessage('Rejection reason must be at least 3 characters')
];

exports.getMyLeaveRequests = [
    check('id')
        .not().isEmpty().withMessage('ID is required')
        .isMongoId().withMessage('Must be a valid user ID'),
    check('status')
        .optional().isIn(['Pending', 'Approved', 'Rejected']).withMessage('Invalid status filter')
];

exports.getMyLeaveBalances = [
    check('id')
        .not().isEmpty().withMessage('ID is required')
        .isMongoId().withMessage('Must be a valid user ID'),
];

exports.getMyAvailableLeaves = [
    check('id')
        .not().isEmpty().withMessage('ID is required')
        .isMongoId().withMessage('Must be a valid user ID'),
];