const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')
const verify = require('../middleware/verifyRoutes')

router.post('/signup',authController.signUp);
router.post('/signin',authController.signIn);
router.get('/logout',authController.logout);
router.patch('/sendverificationcode',verify,authController.sendVerificationCode);
router.patch('/verifyverificationcode',verify,authController.verifyVerificationCode);
router.patch('/changepassword',verify,authController.changePassword);
router.post('/forgotpasswordcode',verify,authController.forgotPasswordCode);
router.patch('/resetpassword',verify,authController.resetPassword);
module.exports = router;