const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transport = require("../middleware/sendMail");

exports.signUp = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email or password cannot be empty" });
    }
    const exisitingUser = await User.findOne({ email: email });
    if (exisitingUser) {
        return res.status(409).json({ success: false, message: "User already Exisit" });
    }
    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({
        email,
        password: hash
    });
    const result = await newUser.save();
    result.password = null;
    res.status(201).json({ success: true, message: "User created", result });
}
exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email or Password can't be empty"
            });
        }

        const existingUser = await User.findOne({ email }).select('+password');

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        const match = await bcrypt.compare(password, existingUser.password);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Password doesn't match"
            });
        }

        const token = jwt.sign(
            {
                userId: existingUser._id,
                email: existingUser.email,
                verified: existingUser.verified
            },
            process.env.TOKEN_SECRET,
            { expiresIn: '8h' }
        );

        res.cookie('jwt', 'Bearer ' + token, {
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};
exports.logout = (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    return res.status(200).json({
        success: true,
        message: "Logged out"
    });
}
exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {
        const exisitingUser = await User.findOne({ email: email }).select('+verificationCode +verificationCodeValidation');
        if (!exisitingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (exisitingUser.verified == true) {
            return res.status(200).json({
                success: false,
                message: "User already verified"
            })
        }
        const sendCode = Math.floor(Math.random() * 100000).toString().padStart(5, "0");

        const info = await transport.sendMail({
            from: process.env.EMAIL_ADDRESS,
            to: exisitingUser.email,
            subject: "Verfication code",
            html: '<h1>' + sendCode + '</h1>'
        });
        if (info.accepted[0] === exisitingUser.email) {
            exisitingUser.verificationCode = sendCode;
            console.log(exisitingUser.verificationCode);
            exisitingUser.verificationCodeValidation = Date.now();
            await exisitingUser.save();
            return res.status(200).json({
                success: true,
                message: "Verification code send successfull"
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: "Verfication Code not sent"
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })

    }
}
exports.verifyVerificationCode = async (req, res) => {
    const { email, responseCode } = req.body;
    const exisitingUser = await User.findOne({ email }).select('+verificationCode');
    if (exisitingUser.verified === true) {
        return res.status(200).json({
            success: false,
            message: "User already verified"
        })
    }
    if (!exisitingUser) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    if (exisitingUser.verificationCode != responseCode) {
        return res.status(404).json({
            success: false,
            message: "Responsecode doesn't match"
        })
    }
    exisitingUser.verified = true;
    const result = await exisitingUser.save()
    return res.status(200).json({
        success: true,
        message: "User verified",
        result
    })

}
exports.changePassword = async (req, res) => {
    const { userId, verified } = req.user;
    const { oldPassword, newPassword } = req.body;
    const exisitingUser = await User.findOne({ _id: userId }).select('+password');
    if (!exisitingUser) {
        return res.status(401).json({
            success: false,
            message: "Your not authorized"
        })
    }

    const hash = await bcrypt.compare(exisitingUser.password, oldPassword)
    if (hash) {
        return res.status(400).json({
            success: false,
            message: "The password you entered is incorrect!"
        })
    }
    if (exisitingUser.password === newPassword) {
        return res.status(409).json({
            success: false,
            message: "New password cannot be same as old password"
        })
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    exisitingUser.password = hashPassword;
    await exisitingUser.save();
    res.status(200).json({
        success: true,
        message: "Password updated"
    });

}
exports.forgotPasswordCode = async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email: email }).select('+forgetPasswordCode +forgetPasswordCodeValidation');

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "Enter a valid email."
            });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Send email
        console.log("Sending code to:", email);
        await transport.sendMail({
            from: process.env.EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Verification code",
            html: `<h4>Enter this code to reset your password</h4><br><h1>${code}</h1>`
        });

        // Save code & expiry
        existingUser.forgetPasswordCode = code;
        existingUser.forgetPasswordCodeValidation = Date.now() + 2 * 60 * 1000; // 10 minutes
        await existingUser.save();

        res.status(200).json({
            success: true,
            message: "Code sent successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};
exports.resetPassword = async (req, res) => {
    try {
        const { code, newPassword } = req.body || {};
        const { email } = req.user;

        if (!code || !newPassword) {
            return res.status(400).json({ success: false, message: "Code and new password are required" });
        }

        const existingUser = await User.findOne({ email }).select('+password +forgetPasswordCode +forgetPasswordCodeValidation');

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (existingUser.forgetPasswordCode !== code) {
            return res.status(400).json({ success: false, message: "The code is invalid" });
        }

        if (Date.now() > existingUser.forgetPasswordCodeValidation) {
            return res.status(400).json({ success: false, message: "The code you entered has expired" });
        }

        const match = await bcrypt.compare(newPassword, existingUser.password);
        if (match) {
            return res.status(409).json({ success: false, message: "The new password cannot be the same as the old password" });
        }

        existingUser.password = await bcrypt.hash(newPassword, 10);
        existingUser.forgetPasswordCode = null;
        existingUser.forgetPasswordCodeValidation = null;

        await existingUser.save();

        res.status(200).json({ success: true, message: "Password reset successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

