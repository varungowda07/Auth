const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendMail = require("../middleware/sendMail");

// Helper function for sending standardized responses
const sendResponse = (res, status, success, message, data = null) => {
    return res.status(status).json({ success, message, result: data });
};

exports.signUp = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(res, 400, false, "Email or password cannot be empty");
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return sendResponse(res, 409, false, "User already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ email, password: hashedPassword });
        newUser.password = undefined; // Hide password in response

        return sendResponse(res, 201, true, "User created successfully", newUser);
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, false, "Internal Server Error");
    }
};

exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return sendResponse(res, 400, false, "Email or password cannot be empty");
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) return sendResponse(res, 401, false, "User not found");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendResponse(res, 401, false, "Incorrect password");

        const token = jwt.sign(
            { userId: user._id, email: user.email, verified: user.verified },
            process.env.TOKEN_SECRET,
            { expiresIn: '8h' }
        );

        res.cookie('jwt', 'Bearer ' + token, {
            maxAge: 8 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return sendResponse(res, 200, true, "User logged in successfully", { token });
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, false, "Internal Server Error");
    }
};

exports.logout = async (req, res) => {
    try {
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        return sendResponse(res, 200, true, "Logged out successfully");
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, false, "Internal Server Error");
    }
};

exports.sendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return sendResponse(res, 400, false, "Email is required");

        const user = await User.findOne({ email }).select('+verificationCode +verificationCodeValidation');
        if (!user) return sendResponse(res, 404, false, "User not found");
        if (user.verified) return sendResponse(res, 200, false, "User already verified");

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await sendMail({
            to: user.email,
            subject: "Verification Code",
            html: `<h3>Your verification code is:</h3><h1>${code}</h1>`
        });

        // await transport.sendMail({
        //     from: process.env.EMAIL_ADDRESS,
        //     to: user.email,
        //     subject: "Verification Code",
        //     html: `<h3>Your verification code is:</h3><h1>${code}</h1>`
        // });

        user.verificationCode = code;
        console.log(user.verificationCode);
        user.verificationCodeValidation = Date.now() + 10 * 60 * 1000; // 10 min expiry
        await user.save();

        return sendResponse(res, 200, true, "Verification code sent successfully");
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, false, "Failed to send verification code");
    }
};

exports.verifyVerificationCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return sendResponse(res, 400, false, "Email and code are required");

        const user = await User.findOne({ email }).select('+verificationCode +verificationCodeValidation');
        if (!user) return sendResponse(res, 404, false, "User not found");
        if (user.verified) return sendResponse(res, 200, false, "User already verified");

        if (user.verificationCode !== code) return sendResponse(res, 400, false, "Invalid verification code");

        if (Date.now() > user.verificationCodeValidation) return sendResponse(res, 400, false, "Verification code expired");

        user.verified = true;
        user.verificationCode = null;
        user.verificationCodeValidation = null;
        await user.save();

        return sendResponse(res, 200, true, "User verified successfully");
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, false, "Verification failed");
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { userId } = req.user;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) return sendResponse(res, 400, false, "Old and new passwords are required");

        const user = await User.findById(userId).select('+password');
        if (!user) return sendResponse(res, 401, false, "User not authorized");

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return sendResponse(res, 400, false, "Incorrect old password");

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) return sendResponse(res, 409, false, "New password cannot be same as old password");

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return sendResponse(res, 200, true, "Password updated successfully");
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, false, "Failed to update password");
    }
};

exports.forgotPasswordCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return sendResponse(res, 400, false, "Email is required");

        const user = await User.findOne({ email }).select('+forgetPasswordCode +forgetPasswordCodeValidation');
        if (!user) return sendResponse(res, 404, false, "User not found");

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await sendMail({
            to: user.email,
            subject: "Verification Code",
            html: `<h3>Your verification code is:</h3><h1>${code}</h1>`
        });

        // await transport.sendMail({
        //     from: process.env.EMAIL_ADDRESS,
        //     to: user.email,
        //     subject: "Password Reset Code",
        //     html: `<h3>Use this code to reset your password:</h3><h1>${code}</h1>`
        // });

        user.forgetPasswordCode = code;
        user.forgetPasswordCodeValidation = Date.now() + 10 * 60 * 1000; // 10 min expiry
        await user.save();

        return sendResponse(res, 200, true, "Password reset code sent successfully");
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, false, "Failed to send password reset code");
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { code, newPassword } = req.body;
        const { email } = req.user;
        if (!code || !newPassword) return sendResponse(res, 400, false, "Code and new password required");

        const user = await User.findOne({ email }).select('+password +forgetPasswordCode +forgetPasswordCodeValidation');
        if (!user) return sendResponse(res, 404, false, "User not found");

        if (user.forgetPasswordCode !== code) return sendResponse(res, 400, false, "Invalid code");
        if (Date.now() > user.forgetPasswordCodeValidation) return sendResponse(res, 400, false, "Code expired");

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) return sendResponse(res, 409, false, "New password cannot be same as old password");

        user.password = await bcrypt.hash(newPassword, 10);
        user.forgetPasswordCode = null;
        user.forgetPasswordCodeValidation = null;
        await user.save();

        return sendResponse(res, 200, true, "Password reset successfully");
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, false, "Failed to reset password");
    }
};
