const express = require('express');
const {
    getAllJobs,
    getJobDetails,
    searchJobs,
    getJobsByCategory,
    getRecommendedJobs
} = require('../controllers/jobController');
const { requireAuth, loadUser } = require('../middleware/auth');

const router = express.Router();

// Public job routes
router.get('/', getAllJobs);
router.get('/search', searchJobs);
router.get('/category/:category', getJobsByCategory);
router.get('/recommended', requireAuth, loadUser, getRecommendedJobs);
router.get('/:id', getJobDetails);

module.exports = router;
