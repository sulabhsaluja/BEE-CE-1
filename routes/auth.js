const express = require('express');
const { body } = require('express-validator');
const {
    showLogin,
    login,
    showRegister,
    register,
    logout,
    showForgotPassword,
    forgotPassword,
    showChangePassword,
    changePassword,
    getProfile,
    updateProfile
} = require('../controllers/authController');
const { requireAuth, requireGuest } = require('../middleware/auth');

const router = express.Router();

// Login routes
router.get('/login', requireGuest, showLogin);
router.post('/login', requireGuest, [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
], login);

// Register routes
router.get('/register', requireGuest, showRegister);
router.post('/register', requireGuest, [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
], register);

// Logout route
router.post('/logout', requireAuth, logout);

// Forgot password routes
router.get('/forgot-password', requireGuest, showForgotPassword);
router.post('/forgot-password', requireGuest, [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address')
], forgotPassword);

// Change password routes
router.get('/change-password', requireAuth, showChangePassword);
router.post('/change-password', requireAuth, [
    body('currentPassword')
        .isLength({ min: 6 })
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('confirmNewPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('New passwords do not match');
            }
            return true;
        })
], changePassword);

module.exports = router;
