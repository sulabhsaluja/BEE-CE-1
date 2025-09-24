const express = require('express');
const { body } = require('express-validator');
const {
    showApplicationForm,
    submitApplication,
    getUserApplications,
    getApplicationDetails,
    withdrawApplication,
    updatePersonalNotes,
    recordFollowUp,
    getFollowUpApplications
} = require('../controllers/applicationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All application routes require authentication
router.use(requireAuth);

// Application routes
router.get('/', getUserApplications);
router.get('/follow-up', getFollowUpApplications);
router.get('/apply/:jobId', showApplicationForm);

router.post('/apply/:jobId', [
    body('coverLetter')
        .trim()
        .isLength({ min: 50, max: 1500 })
        .withMessage('Cover letter must be between 50 and 1500 characters'),
    body('expectedSalary')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Expected salary must be a positive number'),
    body('availableFrom')
        .optional()
        .isDate()
        .withMessage('Please provide a valid available from date'),
    body('noticePeriod')
        .optional()
        .isIn(['Immediate', '15 days', '1 month', '2 months', '3 months', 'Other'])
        .withMessage('Please select a valid notice period')
], submitApplication);

router.get('/:id', getApplicationDetails);

// AJAX routes for application management
router.put('/:id/withdraw', withdrawApplication);
router.put('/:id/notes', [
    body('personalNotes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters')
], updatePersonalNotes);
router.post('/:id/follow-up', recordFollowUp);

module.exports = router;
