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
const LeaveRequestsModel = require('../models/leaverequests.js');
const { sendPushNotification } = require('../libs/firebaseNotification.js');
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
        user.device_token = req.body.device_token || "";
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

    const { name, email, phone, role, branch_id, department_id, manager_id, dob } = req.body;

    try {
        // Create new user
        const newUser = new UsersModel({
            name,
            email,
            phone,
            role,
            branch_id,
            department_id,
            manager_id,
            dob: dob || '',
            profile_image: 'default.jpg'
        });

        const user = await newUser.save();

        // Get leave assignment for employee's branch and department
        const currentYear = new Date().getFullYear();
        console.log('current year---', currentYear);
        
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

const getEmployeeLeaveBalance = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const { branch_id, department_id, year,
            // employee_id, 
            // leave_type_id 
        } = req.body;

        // Build query conditions
        const query = { isDeleted: false };

        // if (employee_id) {
        //     query.employee_id = employee_id;
        // }

        // if (leave_type_id) {
        //     query.leave_type_id = leave_type_id;
        // }

        if (year) {
            query.year = parseInt(year);
        }

        // First find matching users if branch or department filters are provided
        if (branch_id || department_id) {
            const userQuery = { isDeleted: false };
            if (branch_id) userQuery.branch_id = branch_id;
            if (department_id) userQuery.department_id = department_id;

            const matchingUsers = await UsersModel.find(userQuery).select('_id');
            const userIds = matchingUsers.map(user => user._id);

            // Add matching user IDs to the main query
            // if (employee_id) {
            //     // If employee_id was specified, it must be in the matching users
            //     if (!userIds.some(id => id.equals(employee_id))) {
            //         return res.status(200).send(response.toJson([]));
            //     }
            // } else {
                query.employee_id = { $in: userIds };
            // }
        }

        // Fetch leave balances with populated references
        const leaveBalances = await EmployeeLeaveBalancesModel.find(query)
            .populate('employee_id', 'name phone')
            .populate('leave_type_id', 'name')
            .sort({ 'employee_id.name': 1, 'leave_type_id.name': 1 });

        return res.status(200).send(response.toJson(leaveBalances));

    } catch (err) {
        console.error('Error fetching employee leave balances:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
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

const requestLeave = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const { leave_type_id, leave_taken, to_date, from_date, reason } = req.body;
        const employee_id = req.id; // Get employee ID from JWT token

        // Get employee details including manager
        const employee = await UsersModel.findById(employee_id).populate('manager_id');
        console.log('employee inside leave request:::--', employee);

        if (!employee) {
            return res.status(404).send(response.toJson("Employee not found"));
        }

        // Check if employee has sufficient leave balance
        const currentYear = new Date().getFullYear();
        console.log('currentYear:::--', currentYear);
        
        const leaveBalance = await EmployeeLeaveBalancesModel.findOne({
            employee_id,
            leave_type_id,
            year: currentYear,
            isDeleted: false
        });

        if (!leaveBalance || leaveBalance.remaining_leaves < leave_taken) {
            return res.status(400).send(response.toJson("Insufficient leave balance"));
        }

        // Create leave request
        const leaveRequest = new LeaveRequestsModel({
            employee_id,
            leave_type_id,
            manager_id: employee.manager_id._id,
            leave_taken,
            to_date: new Date(to_date),
            from_date: new Date(from_date),
            reason,
            status: 'Pending'
        });

        await leaveRequest.save();

        // Send push notification to manager if they have a device token
        if (employee.manager_id.device_token) {
            const notificationTitle = 'New Leave Request';
            const notificationBody = `${employee.name} has requested ${leave_taken} day(s) leave for ${new Date(from_date).toLocaleDateString()} to ${new Date(to_date).toLocaleDateString()}`;

            try {
                await sendPushNotification(
                    employee.manager_id.device_token,
                    notificationTitle,
                    notificationBody,
                    {
                        type: 'LEAVE_REQUEST',
                        request_id: leaveRequest._id.toString()
                    }
                );
            } catch (notificationError) {
                console.error('Failed to send push notification:', notificationError);
                // Don't throw error, continue with response
            }
        }

        // Return response with populated data
        const populatedRequest = await LeaveRequestsModel.findById(leaveRequest._id)
            .populate('employee_id', 'name email')
            .populate('leave_type_id', 'name')
            .populate('manager_id', 'name email');

        return res.status(201).send(response.toJson(populatedRequest));

    } catch (err) {
        console.error('Error requesting leave:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const getManagerLeaveRequests = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const manager_id = req.id; // manager's id from auth
        const { status } = req.body;

        const query = { manager_id, isDeleted: false };
        if (status) query.status = status;

        const requests = await LeaveRequestsModel.find(query)
            .populate('employee_id', 'name email device_token')
            .populate('leave_type_id', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).send(response.toJson(requests));
    } catch (err) {
        console.error('Error fetching manager leave requests:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const approveLeave = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const manager_id = req.id;
        const { request_id } = req.body;

        const leaveRequest = await LeaveRequestsModel.findById(request_id);
        if (!leaveRequest || leaveRequest.isDeleted) {
            return res.status(404).send(response.toJson('Leave request not found'));
        }

        if (String(leaveRequest.manager_id) !== String(manager_id)) {
            return res.status(403).send(response.toJson('Not authorized to approve this request'));
        }

        if (leaveRequest.status !== 'Pending') {
            return res.status(400).send(response.toJson('Only pending requests can be approved'));
        }

        // Update leave balance for employee
        const leaveDate = new Date(leaveRequest.from_date);
        const year = leaveDate.getFullYear();

        const leaveBalance = await EmployeeLeaveBalancesModel.findOne({
            employee_id: leaveRequest.employee_id,
            leave_type_id: leaveRequest.leave_type_id,
            year,
            isDeleted: false
        });

        if (!leaveBalance || leaveBalance.remaining_leaves < leaveRequest.leave_taken) {
            return res.status(400).send(response.toJson('Insufficient leave balance to approve'));
        }

        leaveBalance.used_leaves = (leaveBalance.used_leaves || 0) + Number(leaveRequest.leave_taken);
        await leaveBalance.save();

        leaveRequest.status = 'Approved';
        await leaveRequest.save();

        // Notify employee
        const employee = await UsersModel.findById(leaveRequest.employee_id);
        if (employee && employee.device_token) {
            try {
                await sendPushNotification(
                    employee.device_token,
                    'Leave Approved',
                    `Your leave request for ${new Date(leaveRequest.from_date).toLocaleDateString()} to ${new Date(leaveRequest.to_date).toLocaleDateString()} has been approved.`,
                    { type: 'LEAVE_APPROVED', request_id: leaveRequest._id.toString() }
                );
            } catch (pushErr) {
                console.error('Push notification failed:', pushErr);
            }
        }

        const populated = await LeaveRequestsModel.findById(leaveRequest._id)
            .populate('employee_id', 'name email')
            .populate('leave_type_id', 'name')
            .populate('manager_id', 'name email');

        return res.status(200).send(response.toJson(populated));
    } catch (err) {
        console.error('Error approving leave:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const rejectLeave = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const manager_id = req.id;
        const { request_id, rejection_reason } = req.body;

        const leaveRequest = await LeaveRequestsModel.findById(request_id);
        if (!leaveRequest || leaveRequest.isDeleted) {
            return res.status(404).send(response.toJson('Leave request not found'));
        }

        if (String(leaveRequest.manager_id) !== String(manager_id)) {
            return res.status(403).send(response.toJson('Not authorized to reject this request'));
        }

        if (leaveRequest.status !== 'Pending') {
            return res.status(400).send(response.toJson('Only pending requests can be rejected'));
        }

        leaveRequest.status = 'Rejected';
        leaveRequest.rejection_reason = rejection_reason;
        await leaveRequest.save();

        // Notify employee
        const employee = await UsersModel.findById(leaveRequest.employee_id);
        if (employee && employee.device_token) {
            try {
                await sendPushNotification(
                    employee.device_token,
                    'Leave Rejected',
                    `Your leave request for ${new Date(leaveRequest.from_date).toLocaleDateString()} to ${new Date(leaveRequest.to_date).toLocaleDateString()} was rejected. Reason: ${rejection_reason}`,
                    { type: 'LEAVE_REJECTED', request_id: leaveRequest._id.toString() }
                );
            } catch (pushErr) {
                console.error('Push notification failed:', pushErr);
            }
        }

        const populated = await LeaveRequestsModel.findById(leaveRequest._id)
            .populate('employee_id', 'name email')
            .populate('leave_type_id', 'name')
            .populate('manager_id', 'name email');

        return res.status(200).send(response.toJson(populated));
    } catch (err) {
        console.error('Error rejecting leave:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const getMyLeaveRequests = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const employee_id = req.id;
        const { status } = req.body;

        const query = { employee_id, isDeleted: false };
        if (status) {
            query.status = status;
        }

        const requests = await LeaveRequestsModel.find(query)
            .populate('leave_type_id', 'name')
            .populate('manager_id', 'name phone')
            .sort({ createdAt: -1 });

        return res.status(200).send(response.toJson(requests));
    } catch (err) {
        console.error('Error fetching employee leave requests:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const getMyLeaveBalances = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const employee_id = req.id;
        const currentYear = new Date().getFullYear();

        const leaveBalances = await EmployeeLeaveBalancesModel.find({
            employee_id,
            year: currentYear,
            isDeleted: false
        })
        .populate('leave_type_id', 'name')
        .sort({ 'leave_type_id.name': 1 });

        return res.status(200).send(response.toJson(leaveBalances));
    } catch (err) {
        console.error('Error fetching employee leave balances:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const getMyAvailableLeaves = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const employee_id = req.id;
        const currentYear = new Date().getFullYear();
        console.log('Fetching available leaves for employee:', employee_id  , 'for year:', currentYear);
        
        const leaveBalances = await EmployeeLeaveBalancesModel.find({
            employee_id,
            year: currentYear,
            isDeleted: false
        })
        .populate({
            path: 'leave_type_id',
            match: { isDeleted: false, isActive: true },
            select: 'name applyOnHoliday applyOnPastDays applyBeforeDays'
        })
        .lean();
        console.log('leaves for employee:', leaveBalances);
        
        const availableLeaves = leaveBalances
            .filter(balance => {
                const totalLeaves = balance.total_leaves || 0;
                const usedLeaves = balance.used_leaves || 0;
                const remainingLeaves = totalLeaves - usedLeaves;
                
                return balance.leave_type_id && remainingLeaves > 0;
            })
            .map(balance => ({
                leave_type_id: balance.leave_type_id._id,
                name: balance.leave_type_id.name,
                remaining_leaves: balance.total_leaves - (balance.used_leaves || 0),
                rules: {
                    applyOnHoliday: balance.leave_type_id.applyOnHoliday,
                    applyOnPastDays: balance.leave_type_id.applyOnPastDays,
                    applyBeforeDays: balance.leave_type_id.applyBeforeDays
                }
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        console.log('availableLeaves for employee:', availableLeaves);

        return res.status(200).send(response.toJson(availableLeaves));

    } catch (err) {
        console.error('Error fetching available leaves:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || "An internal server error occurred.";
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

// const getMyAvailableLeaves = async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).send(response.toJson(errors.errors[0].msg));
//     }

//     try {
//         const employee_id = req.id;
//         const currentYear = new Date().getFullYear();

//         // Get employee details including department and branch
//         const employee = await UsersModel.findById(employee_id)
//             .select('department_id branch_id')
//             .lean();

//         if (!employee) {
//             return res.status(404).send(response.toJson("Employee not found"));
//         }

//         // Get current leave assignment based on department and branch
//         const leaveAssignment = await LeaveAssignmentsModel.findOne({
//             department_id: employee.department_id,
//             branch_id: employee.branch_id,
//             year: currentYear,
//             isDeleted: false
//         }).populate({
//             path: 'leave_group_id',
//             match: { isDeleted: false, isActive: true },
//             select: 'name allocation_type year_end_policy leave_types',
//             populate: {
//                 path: 'leave_types.leave_type_id',
//                 match: { isDeleted: false, isActive: true },
//                 select: 'name applyOnHoliday applyOnPastDays applyBeforeDays'
//             }
//         }).lean();

//         if (!leaveAssignment || !leaveAssignment.leave_group_id) {
//             return res.status(404).send(response.toJson("No leave group assigned to your department"));
//         }

//         // Get current leave balances
//         const leaveBalances = await EmployeeLeaveBalancesModel.find({
//             employee_id,
//             year: currentYear,
//             isDeleted: false
//         }).lean();

//         // Create a map of leave balances for quick lookup
//         const balanceMap = new Map(
//             leaveBalances.map(balance => [balance.leave_type_id.toString(), balance])
//         );

//         // Combine leave types with their balances
//         const availableLeaves = leaveAssignment.leave_group_id.leave_types
//             .filter(lt => lt.leave_type_id) // Filter out any null leave types
//             .map(lt => {
//                 const balance = balanceMap.get(lt.leave_type_id._id.toString()) || {
//                     total_leaves: lt.paid_leaves,
//                     used_leaves: 0
//                 };

//                 return {
//                     leave_type_id: lt.leave_type_id._id,
//                     name: lt.leave_type_id.name,
//                     allocation: {
//                         total_leaves: balance.total_leaves || lt.paid_leaves,
//                         used_leaves: balance.used_leaves || 0,
//                         remaining_leaves: (balance.total_leaves || lt.paid_leaves) - (balance.used_leaves || 0)
//                     },
//                     rules: {
//                         applyOnHoliday: lt.leave_type_id.applyOnHoliday,
//                         applyOnPastDays: lt.leave_type_id.applyOnPastDays,
//                         applyBeforeDays: lt.leave_type_id.applyBeforeDays
//                     }
//                 };
//             });

//         const response = {
//             leave_group: {
//                 name: leaveAssignment.leave_group_id.name,
//                 allocation_type: leaveAssignment.leave_group_id.allocation_type,
//                 year_end_policy: leaveAssignment.leave_group_id.year_end_policy
//             },
//             available_leaves: availableLeaves
//         };

//         return res.status(200).send(response.toJson(response));

//     } catch (err) {
//         console.error('Error fetching available leaves:', err);
//         const statusCode = err.statusCode || 500;
//         const errMess = err.message || "An internal server error occurred.";
//         return res.status(statusCode).send(response.toJson(errMess));
//     }
// }

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
    getEmployeeLeaveBalance,
    requestLeave,
    getManagerLeaveRequests,
    approveLeave,
    rejectLeave,
    getMyLeaveRequests,
    getMyLeaveBalances,
    getMyAvailableLeaves,
    // testUserApi
}
