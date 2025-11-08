
const UserController = require("../controllers/userController");
const UserValidation = require("../validations/userValidation");
const router = require('express').Router();
const { isCommonUserAuthenticated, adminVerifyToken, superAdminVerifyToken } = require("../middleware/authJwt");

// Add just final test deploy
// router.post("/test-user-api", UserValidation.testUserApi, TestUserController.testUserApi);

router.post("/login", UserValidation.loginApi, UserController.loginApi);
router.post("/verify-otp", UserValidation.verifyOTP, UserController.verifyOtpAndLogin);

// router.put("/test-user-api/:userId", UserValidation.update, TestUserController.update);

module.exports = router;
