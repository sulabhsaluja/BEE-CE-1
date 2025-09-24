const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { getDashboard, getProfileSuggestions } = require('../controllers/dashboardController');
const { getProfile, updateProfile } = require('../controllers/authController');

const router = express.Router();

// Dashboard routes
router.get('/dashboard', requireAuth, getDashboard);
router.get('/api/profile-suggestions', requireAuth, getProfileSuggestions);

// Profile routes
router.get('/profile', requireAuth, getProfile);
router.post('/profile', requireAuth, [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    body('phone')
        .optional()
        .matches(/^\d{10}$/)
        .withMessage('Please enter a valid 10-digit phone number'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
    body('skills')
        .optional()
        .trim(),
    body('experience')
        .optional()
        .isIn(['Fresher', '0-1 years', '1-3 years', '3-5 years', '5+ years'])
        .withMessage('Please select a valid experience level'),
    body('degree')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Degree cannot exceed 100 characters'),
    body('institution')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Institution cannot exceed 100 characters'),
    body('year')
        .optional()
        .isInt({ min: 1950, max: new Date().getFullYear() + 4 })
        .withMessage('Please enter a valid graduation year'),
    body('linkedIn')
        .optional()
        .isURL()
        .withMessage('Please enter a valid LinkedIn URL'),
    body('github')
        .optional()
        .isURL()
        .withMessage('Please enter a valid GitHub URL'),
    body('desiredSalaryMin')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Minimum desired salary must be a positive number'),
    body('desiredSalaryMax')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Maximum desired salary must be a positive number')
        .custom((value, { req }) => {
            if (req.body.desiredSalaryMin && value && parseInt(value) < parseInt(req.body.desiredSalaryMin)) {
                throw new Error('Maximum salary must be greater than or equal to minimum salary');
            }
            return true;
        })
], updateProfile);

module.exports = router;
