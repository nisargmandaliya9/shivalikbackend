
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

router.post("/department-list", [], UserController.getDepartmentList);
router.post("/branch-list", [], UserController.getBranchList);

router.get("/holiday-list", [], UserController.getHolidayList);
router.post("/add-holiday", UserValidation.addHoliday, UserController.addHoliday);
router.post("/edit-holiday", UserValidation.editHoliday, UserController.editHoliday);
router.post("/delete-holiday", UserValidation.deleteHoliday, UserController.deleteHoliday);

router.get("/holidaygroup-list", [], UserController.getHolidayGroupList);
router.post("/add-holidaygroup", UserValidation.addHolidayGroup, UserController.addHolidayGroup);
router.post("/edit-holidaygroup", UserValidation.editHolidayGroup, UserController.editHolidayGroup);
router.post("/delete-holidaygroup", UserValidation.deleteHolidayGroup, UserController.deleteHolidayGroup);

router.get("/leavegroup-list", [], UserController.getLeaveGroupList);
router.post("/add-leavegroup", UserValidation.addLeaveGroup, UserController.addLeaveGroup);
router.post("/edit-leavegroup", UserValidation.editLeaveGroup, UserController.editLeaveGroup);
router.post("/delete-leavegroup", UserValidation.deleteLeaveGroup, UserController.deleteLeaveGroup);

router.post("/leaveassignment-list", UserValidation.getLeaveAssignmentList, UserController.getLeaveAssignmentList);
router.post("/add-leaveassignment", UserValidation.addLeaveAssignment, UserController.addLeaveAssignment);
router.post("/delete-leaveassignment", UserValidation.deleteLeaveAssignment, UserController.deleteLeaveAssignment);

router.post("/employee-list", UserValidation.getEmployeeList, UserController.getEmployeeList);
router.post("/add-employee", UserValidation.addEmployee, UserController.addEmployee);
router.post("/edit-employee", UserValidation.editEmployee, UserController.editEmployee);
router.post("/delete-employee", UserValidation.deleteEmployee, UserController.deleteEmployee);

module.exports = router;
