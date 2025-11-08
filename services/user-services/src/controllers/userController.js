const messages = require("../message/index.js");
const response = require("../config/response.js");
// const config = require("../config/auth.js");
var jwt = require("jsonwebtoken");
// var bcrypt = require("bcryptjs");

// const uuid = require('uuidv4');
const { validationResult } = require('express-validator');
const sendOtp = require('../libs/sendOtp.js');
const SendMail = require('../libs/sendMail.js');
const CommonConfig = require('../config/common.js');
const CommonFun = require('../libs/common.js');
const axios = require('axios');
const retry = require('async-retry');
const CommonController = require('./commonController.js')
const UsersModel = require('../models/users.js');
const { publishUserUpdate, publishAllUserUpdate } = require('../libs/rabbitmq.js');
const { territoryCache } = require("../utils/territoryCache.js");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const moment = require('moment'); // For date ranges
const common = require("../config/common.js");

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
        const { phone, password } = req.body;

        const user = await UsersModel.findOne({ 
            phone, 
            isDeleted: false, 
            isActive: true 
        });

        if (!user) {
            return res.status(401).send(response.toJson("Invalid credentials."));
        }

        if (user.password !== password) {
            return res.status(401).send(response.toJson("Invalid credentials."));
        }
        console.log('hello');
        
        // 1. Generate a 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        user.otpcode = otp;
        user.otpverified = false; // Reset verification status
        user.updatedAt = Date.now();
        
        await user.save();
        
        return res.status(200).send(response.toJson({
            message: "OTP sent successfully."
        }));

    } catch (err) {
        console.log(err);
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
        user.otpcode = undefined;

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

module.exports = {
    loginApi,
    verifyOtpAndLogin,
    // testUserApi
}