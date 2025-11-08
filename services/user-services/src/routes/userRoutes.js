
const UserController = require("../controllers/userController");
const UserValidation = require("../validations/userValidation");
const router = require('express').Router();
const { isCommonUserAuthenticated, adminVerifyToken, superAdminVerifyToken } = require("../middleware/authJwt");

// Add just final test deploy
// router.post("/test-user-api", UserValidation.testUserApi, TestUserController.testUserApi);

router.post("/login", UserValidation.loginApi, UserController.loginApi);
router.post("/verify-otp", UserValidation.verifyOTP, UserController.verifyOtpAndLogin);

router.get("/leavetype-list", [], UserController.getLeaveTypeList);
router.post("/add-leavetype", UserValidation.addLeaveType, UserController.addLeaveType);
router.post("/edit-leavetype", UserValidation.editLeaveType, UserController.editLeaveType);
router.post("/delete-leavetype", UserValidation.deleteLeaveType, UserController.deleteLeaveType);

router.get("/employee-list", [], UserController.getEmployeeList);
router.post("/add-employee", UserValidation.addEmployee, UserController.addEmployee);
router.post("/edit-employee", UserValidation.editEmployee, UserController.editEmployee);
router.post("/delete-employee", UserValidation.deleteEmployee, UserController.deleteEmployee);

module.exports = router;
