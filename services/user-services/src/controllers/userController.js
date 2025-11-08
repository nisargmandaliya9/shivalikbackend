// const messages = require("../message/index.js");
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
const DepartmentsModel = require('../models/departments.js');
const BranchModel = require('../models/branchs.js');
const HolidaysModel = require('../models/holidays.js');
const HolidayGroupsModel = require("../models/holidaygroups.js");
const LeaveGroupsModel = require('../models/leavegroups.js');
const LeaveAssignmentsModel = require('../models/leaveassignments.js');
const EmployeeLeaveBalancesModel = require('../models/employeeleavebalances.js');
// const { publishUserUpdate, publishAllUserUpdate } = require('../libs/rabbitmq.js');
// const { territoryCache } = require("../utils/territoryCache.js");
// const mongoose = require('mongoose');
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
        // console.log('user:::', user);
        
        if (!user) {
            return res.status(401).send(response.toJson("Invalid credentials."));
        }

        // if (user.role === "Admin") {
        //     return res.status(403).send(response.toJson("Admins are not allowed to log in from this portal."));
        // }

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
    const { name, applyOnHoliday, applyOnPastDays, applyBeforeDays, isActive } = req.body;

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
            applyBeforeDays,
            isActive: isActive === undefined ? true : isActive
        });

        const savedLeaveType = await newLeaveType.save();
        res.status(201).json(savedLeaveType);

    } catch (error) {
        res.status(500).json({ message: "Error adding leave type", error: error.message });
    }
}

const editLeaveType = async (req, res) => {
    const { name, applyOnHoliday, applyOnPastDays, applyBeforeDays, isActive, id } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (applyOnHoliday !== undefined) updateData.applyOnHoliday = applyOnHoliday;
    if (applyOnPastDays !== undefined) updateData.applyOnPastDays = applyOnPastDays;
    if (applyBeforeDays !== undefined) updateData.applyBeforeDays = applyBeforeDays;
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

// Holidays CRUD
const getHolidayList = async (req, res) => {
    try {
        const holidays = await HolidaysModel.find({ isDeleted: false }).sort({ createdAt: -1 });
        return res.status(200).send(response.toJson(holidays));
    } catch (err) {
        console.error('Error fetching holidays:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const addHoliday = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    const { name, description, date } = req.body;

    if (!name || !date) {
        return res.status(400).json({ message: "Name and date are required." });
    }

    try {
        const existing = await HolidaysModel.findOne({ name: name, date: date, isDeleted: false });
        if (existing) {
            return res.status(400).json({ message: "Holiday already exists for this date." });
        }

        const newHoliday = new HolidaysModel({
            name,
            description,
            date
        });

        const savedHoliday = await newHoliday.save();
        res.status(201).json(savedHoliday);

    } catch (error) {
        res.status(500).json({ message: "Error adding holiday", error: error.message });
    }
}

const editHoliday = async (req, res) => {
    const { id, name, description, date } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;

    if (Object.keys(updateData).length === 0) {
        return res.status(200).json({ message: "No updates provided, success response." });
    }

    try {
        const updatedHoliday = await HolidaysModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedHoliday) {
            return res.status(404).json({ message: "Holiday not found." });
        }

        res.status(200).json(updatedHoliday);

    } catch (error) {
        res.status(500).json({ message: "Error updating holiday", error: error.message });
    }
}

const deleteHoliday = async (req, res) => {
    const { id } = req.body;

    try {
        const deletedHoliday = await HolidaysModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!deletedHoliday) {
            return res.status(404).json({ message: "Holiday not found." });
        }

        res.status(200).json({ message: "Holiday deleted successfully." });

    } catch (error) {
        res.status(500).json({ message: "Error deleting holiday", error: error.message });
    }
}

const getHolidayGroupList = async (req, res) => {
    try {
        const holidayGroups = await HolidayGroupsModel.find({ isDeleted: false })
        .populate('holiday_id', 'name date')
        .sort({ createdAt: -1 });
        return res.status(200).send(response.toJson(holidayGroups));
    } catch (err) {
        console.error('Error fetching holiday groups:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const addHolidayGroup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    const { name, holiday_id } = req.body;

    if (!name || !holiday_id) {
        return res.status(400).json({ message: "Name and holiday ID are required." });
    }

    try {
        const existing = await HolidayGroupsModel.findOne({ name: name, holiday_id: holiday_id, isDeleted: false });
        if (existing) {
            return res.status(400).json({ message: "Holiday already exists for this date." });
        }

        const newHoliday = new HolidayGroupsModel({
            name,
            holiday_id,
        });

        const savedHoliday = await newHoliday.save();
        res.status(201).json(savedHoliday);

    } catch (error) {
        res.status(500).json({ message: "Error adding holiday", error: error.message });
    }
}

const editHolidayGroup = async (req, res) => {
    const { id, name, holiday_id } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (holiday_id !== undefined) updateData.holiday_id = holiday_id;
    if (date !== undefined) updateData.date = date;

    if (Object.keys(updateData).length === 0) {
        return res.status(200).json({ message: "No updates provided, success response." });
    }

    try {
        const updatedHolidayGroup = await HolidayGroupsModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedHolidayGroup) {
            return res.status(404).json({ message: "Holiday Group not found." });
        }

        res.status(200).json(updatedHolidayGroup);

    } catch (error) {
        res.status(500).json({ message: "Error updating holiday group", error: error.message });
    }
}

const deleteHolidayGroup = async (req, res) => {
    const { id } = req.body;

    try {
        const deletedHolidayGroup = await HolidayGroupsModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!deletedHolidayGroup) {
            return res.status(404).json({ message: "Holiday Group not found." });
        }

        res.status(200).json({ message: "Holiday Group deleted successfully." });

    } catch (error) {
        res.status(500).json({ message: "Error deleting holiday group", error: error.message });
    }
}

// Leave Groups CRUD Operations
const getLeaveGroupList = async (req, res) => {
    try {
        const leaveGroups = await LeaveGroupsModel.find({ isDeleted: false })
        .populate({
            path: 'leave_types.leave_type_id',
            select: 'name'
        })
        .sort({ createdAt: -1 });
        return res.status(200).send(response.toJson(leaveGroups));
    } catch (err) {
        console.error('Error fetching leave groups:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const addLeaveGroup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    const { name, leave_types, allocation_type, year_end_policy } = req.body;

    try {
        const existing = await LeaveGroupsModel.findOne({ name, isDeleted: false });
        if (existing) {
            return res.status(400).json({ message: "Leave group with this name already exists." });
        }

        const newLeaveGroup = new LeaveGroupsModel({
            name,
            leave_types,
            allocation_type,
            year_end_policy
        });

        const savedLeaveGroup = await newLeaveGroup.save();
        
        // Populate the leave type names before sending response
        const populatedLeaveGroup = await LeaveGroupsModel.findById(savedLeaveGroup._id)
            .populate({
                path: 'leave_types.leave_type_id',
                select: 'name'
            });

        res.status(201).json(populatedLeaveGroup);

    } catch (error) {
        res.status(500).json({ message: "Error adding leave group", error: error.message });
    }
}

const editLeaveGroup = async (req, res) => {
    const { id, name, leave_types, allocation_type, year_end_policy } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (leave_types !== undefined) updateData.leave_types = leave_types;
    if (allocation_type !== undefined) updateData.allocation_type = allocation_type;
    if (year_end_policy !== undefined) updateData.year_end_policy = year_end_policy;

    if (Object.keys(updateData).length === 0) {
        return res.status(200).json({ message: "No updates provided, success response." });
    }

    try {
        if (name) {
            const existing = await LeaveGroupsModel.findOne({ 
                name, 
                _id: { $ne: id },
                isDeleted: false 
            });
            if (existing) {
                return res.status(400).json({ message: "Leave group with this name already exists." });
            }
        }

        const updatedLeaveGroup = await LeaveGroupsModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate({
            path: 'leave_types.leave_type_id',
            select: 'name'
        });

        if (!updatedLeaveGroup) {
            return res.status(404).json({ message: "Leave group not found." });
        }

        res.status(200).json(updatedLeaveGroup);

    } catch (error) {
        res.status(500).json({ message: "Error updating leave group", error: error.message });
    }
}

const deleteLeaveGroup = async (req, res) => {
    const { id } = req.body;

    try {
        const deletedLeaveGroup = await LeaveGroupsModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!deletedLeaveGroup) {
            return res.status(404).json({ message: "Leave group not found." });
        }

        res.status(200).json({ message: "Leave group deleted successfully." });

    } catch (error) {
        res.status(500).json({ message: "Error deleting leave group", error: error.message });
    }
}


const getDepartmentList = async (req, res) => {
    try {
        const departments = await DepartmentsModel.find({isDeleted: false}).sort({ createdAt: -1 });
        return res.status(200).send(response.toJson(departments));
    } catch (err) {
        console.error('Error fetching departments:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const getBranchList = async (req, res) => {
    try {
        const branches = await BranchModel.find({isDeleted: false}).sort({ createdAt: -1 });
        return res.status(200).send(response.toJson(branches));
    } catch (err) {
        console.error('Error fetching branches:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const getEmployeeList = async (req, res) => {
    try {
        const currentUserId = req.id;

        const employees = await UsersModel.find({
            isDeleted: false,
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
        // Create new user
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

        // Get leave assignment for employee's branch and department
        const currentYear = new Date().getFullYear();
        const leaveAssignment = await LeaveAssignmentsModel.findOne({
            branch_id,
            department_id,
            year: currentYear,
            isDeleted: false
        });

        if (leaveAssignment) {
            // Get leave group details
            const leaveGroup = await LeaveGroupsModel.findOne({
                _id: leaveAssignment.leave_group_id,
                isDeleted: false
            });

            if (leaveGroup && leaveGroup.leave_types && leaveGroup.leave_types.length > 0) {
                // Create leave balance records for each leave type
                const leaveBalancePromises = leaveGroup.leave_types.map(leaveType => {
                    return new EmployeeLeaveBalancesModel({
                        employee_id: user._id,
                        leave_type_id: leaveType.leave_type_id,
                        total_leaves: leaveType.paid_leaves,
                        year: currentYear
                    }).save();
                });

                await Promise.all(leaveBalancePromises);
            }
        }

        // Populate leave balances for response
        const leaveBalances = await EmployeeLeaveBalancesModel.find({
            employee_id: user._id,
            year: currentYear,
            isDeleted: false
        }).populate('leave_type_id', 'name');

        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            leave_balances: leaveBalances
        });

    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ message: 'Error creating employee', error: error.message });
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


const getLeaveAssignmentList = async (req, res) => {
    try {
        const { year, branch_id, department_id } = req.body;

        const filter = { isDeleted: false };

        if (year) filter.year = year;
        if (branch_id) filter.branch_id = branch_id;
        if (department_id) filter.department_id = department_id;

        const assignments = await LeaveAssignmentsModel.find(filter)
            .populate({ path: 'branch_id', select: 'name' })
            .populate({ path: 'department_id', select: 'name' })
            .sort({ createdAt: -1 });

        return res.status(200).send(response.toJson(assignments));
    } catch (err) {
        console.error('Error fetching leave assignments:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const addLeaveAssignment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    const { branch_id, department_id, leave_group_id, year } = req.body;

    try {
        // Prevent duplicate assignment for same branch/department/leavegroup/year
        const existing = await LeaveAssignmentsModel.findOne({
            branch_id,
            department_id,
            leave_group_id,
            year,
            isDeleted: false
        });
        if (existing) {
            return res.status(400).json({ message: 'Leave assignment already exists for this combination.' });
        }

        const newAssignment = new LeaveAssignmentsModel({
            branch_id,
            department_id,
            leave_group_id,
            year
        });

        const saved = await newAssignment.save();

        // populate related names for response
        const populated = await LeaveAssignmentsModel.findById(saved._id)
            .populate({ path: 'branch_id', select: 'name' })
            .populate({ path: 'department_id', select: 'name' })
            .populate({ path: 'leave_group_id', select: 'name' });

        return res.status(201).json(populated);
    } catch (error) {
        console.error('Error adding leave assignment:', error);
        return res.status(500).json({ message: 'Error adding leave assignment', error: error.message });
    }
}

const deleteLeaveAssignment = async (req, res) => {
    const { id } = req.body;

    try {
        const deleted = await LeaveAssignmentsModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!deleted) {
            return res.status(404).json({ message: 'Leave assignment not found.' });
        }

        return res.status(200).json({ message: 'Leave assignment deleted successfully.' });
    } catch (error) {
        console.error('Error deleting leave assignment:', error);
        return res.status(500).json({ message: 'Error deleting leave assignment', error: error.message });
    }
}


module.exports = {
    loginApi,
    verifyOtpAndLogin,
    getDepartmentList,
    getBranchList,
    getEmployeeList,
    addEmployee,
    editEmployee,
    deleteEmployee,
    getLeaveTypeList,
    addLeaveType,
    editLeaveType,
    deleteLeaveType,
    getHolidayList,
    addHoliday,
    editHoliday,
    deleteHoliday,
    getHolidayGroupList,
    addHolidayGroup,
    editHolidayGroup,
    deleteHolidayGroup,
    getLeaveGroupList,
    addLeaveGroup,
    editLeaveGroup,
    deleteLeaveGroup,
    getLeaveAssignmentList,
    addLeaveAssignment,
    deleteLeaveAssignment,
    // testUserApi
}
