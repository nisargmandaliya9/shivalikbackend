const { check, param } = require('express-validator');

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
