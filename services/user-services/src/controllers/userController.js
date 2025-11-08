const messages = require("../message/index.js");
const response = require("../config/response.js");
// const config = require("../config/auth.js");
var jwt = require("jsonwebtoken");
// var bcrypt = require("bcryptjs");

// const uuid = require('uuidv4');
const { validationResult } = require('express-validator');
// const sendOtp = require('../libs/sendOtp.js');
// const SendMail = require('../libs/sendMail.js');
const CommonConfig = require('../config/common.js');
// const CommonFun = require('../libs/common.js');
// const axios = require('axios');
// const retry = require('async-retry');
// const CommonController = require('./commonController.js')
const UsersModel = require('../models/users.js');
const LeaveTypeModel = require('../models/leavetypes.js');
// const { publishUserUpdate, publishAllUserUpdate } = require('../libs/rabbitmq.js');
// const { territoryCache } = require("../utils/territoryCache.js");
const mongoose = require('mongoose');
// const ObjectId = mongoose.Types.ObjectId;
// const moment = require('moment'); // For date ranges
// const common = require("../config/common.js");

// const testUserApi = async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).send(response.toJson(errors.errors[0].msg));
//     }

//     try {
//         const createUser = {
//             firstName: req.body.firstName,
//         }

//         await UsersModel.create(createUser);

//         return res.status(200).send(response.toJson(messages['en'].common.create_success));

//     } catch (err) {
//         console.log(err);
//         const statusCode = err.statusCode || 500;
//         const errMess = err.message || err;
//         return res.status(statusCode).send(response.toJson(errMess));
//     }
// }

const loginApi = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const { phone } = req.body;

        const user = await UsersModel.findOne({ 
            phone, 
            isDeleted: false, 
            isActive: true 
        });
        
        if (!user) {
            return res.status(401).send(response.toJson("Invalid credentials."));
        }

        if (user.role === "Admin" || user.role === "Superadmin") {
            return res.status(403).send(response.toJson("Admins are not allowed to log in from this portal."));
        }

        // 1. Generate a 4-digit OTP
        // const otp = Math.floor(1000 + Math.random() * 9000).toString();

        user.otpcode = '1234';
        user.otpverified = false; // Reset verification status
        user.updatedAt = Date.now();
        
        await user.save();
        
        return res.status(200).send(response.toJson({
            message: "OTP sent successfully."
        }));

    } catch (err) {
        console.error('catch error:::', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const verifyOtpAndLogin = async (req, res) => {
    const errors = validationResult(req); // Assuming you validate phone/otpcode
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const { phone, otpcode } = req.body;

        const user = await UsersModel.findOne({ phone, isDeleted: false });
        if (!user) {
            return res.status(404).send(response.toJson("User not found."));
        }

        if (!user.otpcode || user.otpcode !== otpcode) {
            return res.status(400).send(response.toJson("Invalid or expired OTP."));
        }

        user.otpverified = true;
        user.otpcode = "";

        const jwtSecret = CommonConfig.JWT_SECRET;
        const payload = {
            user: {
                id: user._id,
                role: user.role,
                phone: user.phone
            }
        };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

        user.token = token;
        user.loginstatus = 'Login';
        user.logindate = Date.now();
        user.updatedAt = Date.now();
        
        await user.save();

        return res.status(200).send(response.toJson({
            message: "Login successful!",
            token: token,
            user: user.toJSON() // Use the toJSON method
        }));

    } catch (err) {
        console.log(err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const getLeaveTypeList = async (req, res) => {
    try {
        const leaveTypes = await LeaveTypeModel.find({isDeleted: false}).sort({ createdAt: -1 });
        return res.status(200).send(response.toJson(leaveTypes));
    } catch (err) {
        console.error('Error fetching leave types:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const addLeaveType = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }
    const { name, applyOnHoliday, applyOnPastDays, isActive } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Leave type name is required." });
    }

    try {
        // Check if leave type already exists
        const existingType = await LeaveTypeModel.findOne({ name });
        if (existingType) {
            return res.status(400).json({ message: "A leave type with this name already exists." });
        }

        const newLeaveType = new LeaveTypeModel({
            name,
            applyOnHoliday,
            applyOnPastDays,
            isActive: isActive === undefined ? true : isActive
        });

        const savedLeaveType = await newLeaveType.save();
        res.status(201).json(savedLeaveType);

    } catch (error) {
        res.status(500).json({ message: "Error adding leave type", error: error.message });
    }
}

const editLeaveType = async (req, res) => {
    const { name, applyOnHoliday, applyOnPastDays, isActive, id } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (applyOnHoliday !== undefined) updateData.applyOnHoliday = applyOnHoliday;
    if (applyOnPastDays !== undefined) updateData.applyOnPastDays = applyOnPastDays;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
        return res.status(200).json({ message: "No updates provided, success response." });
    }

    try {
        const updatedLeaveType = await LeaveTypeModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedLeaveType) {
            return res.status(404).json({ message: "Leave type not found." });
        }

        res.status(200).json(updatedLeaveType);

    } catch (error) {
        res.status(500).json({ message: "Error updating leave type", error: error.message });
    }
}

const deleteLeaveType = async (req, res) => {
    const { id } = req.body;

    try {
        const deletedLeaveType = await LeaveTypeModel.findByIdAndUpdate(
            id,
            { isDeleted: true},
            { new: true }
        );

        if (!deletedLeaveType) {
            return res.status(404).json({ message: "Leave type not found." });
        }

        res.status(200).json({ message: "Leave type deleted successfully." });

    } catch (error) {
        res.status(500).json({ message: "Error deleting leave type", error: error.message });
    }
} 

const getEmployeeList = async (req, res) => {
    try {
        const currentUserId = req.id;

        const employees = await UsersModel.find({
            isDeleted: false,
            role: { $ne: "Admin" },
            _id: { $ne: currentUserId }
        })
        .populate({
            path: "department_id",
            select: "name"
        })
        .populate({
            path: "branch_id",
            select: "name"
        })
        .populate({
            path: "manager_id",
            select: "name phone role"
        })
        .sort({ createdAt: -1 });
        return res.status(200).send(response.toJson(employees));
    } catch (err) {
        console.error('Error fetching employees:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const addEmployee = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    const { name, email, phone, role, branch_id, department_id, dob } = req.body;

    try {

        const newUser = new UsersModel({
            name,
            email,
            phone,
            role,
            branch_id,
            department_id,
            dob: dob || '',
            profile_image: 'default.jpg'
        });

        const user = await newUser.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
}

const editEmployee = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    const { id, name, email, phone, role, branch_id, department_id, dob } = req.body;

    try {
        let user = await UsersModel.findById(id);
        if (!user || user.isDeleted) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (role !== undefined) updateData.role = role;
        if (branch_id !== undefined) updateData.branch_id = branch_id;
        if (department_id !== undefined) updateData.department_id = department_id;
        if (dob !== undefined) updateData.dob = dob;

        const updatedUser = await UsersModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
}

const deleteEmployee = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    const { id } = req.body;

    try {
        const user = await UsersModel.findByIdAndUpdate(
            id,
            { isDeleted: true, isActive: false, token: null, loginstatus: 'Logout' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
}

module.exports = {
    loginApi,
    verifyOtpAndLogin,
    getEmployeeList,
    addEmployee,
    editEmployee,
    deleteEmployee,
    getLeaveTypeList,
    addLeaveType,
    editLeaveType,
    deleteLeaveType,
    // testUserApi
}