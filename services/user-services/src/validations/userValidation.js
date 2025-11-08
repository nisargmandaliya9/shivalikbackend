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
];

exports.editEmployee = [
    check('id')
        .not().isEmpty().withMessage('ID is required')
        .isMongoId().withMessage('Must be a valid user ID'),
];

exports.deleteEmployee = [
    check('id').not().isEmpty().withMessage('ID is required').isMongoId().withMessage('Must be a valid user ID'),
];