const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('./index.js')
// const { commonStatus, userActivity } = require('../config/data.js')

const UsersSchema = new Schema({
    branch_id: { type: Schema.Types.ObjectId, ref: 'branchs', required: true },
    department_id: { type: Schema.Types.ObjectId, ref: 'departments', required: true },
    manager_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    role: { type: String, enum: ['Employee', 'Manager', 'HR', 'Admin'], required: true },
    name: {
        type: String,
        default: ''
    },
    profile_image: {
        type: String,
        required: false,
        default: 'default.jpg'
    },
    dob: {
        type: String,
        required: false,
        default: ''
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        required: true
    },
    otpcode: {
        type: String,
        required: false
    },
    otpverified: {
        type: Boolean,
        default: false
    },
    token: {
        type: String,
        required: false
    },
    device_token: {
        type: String,
        required: false
    },
    loginstatus: { type: String, enum: ['Logout', 'Login'], default: 'Logout' },
    logindate: Date,
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
});

UsersSchema.methods.toJSON = function () {
    var obj = this.toObject();
    delete obj.hashed_password;
    delete obj.salt;
    return obj;
};

const UsersModel = DBConnect.model('users', UsersSchema)

UsersModel.syncIndexes().then(() => {
    console.log('Users Model Indexes Synced')
}).catch((err) => {
    console.log('Users Model Indexes Sync Error', err)
})

module.exports = UsersModel
