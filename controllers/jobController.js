const { validationResult } = require('express-validator');
const Job = require('../models/Job');
const Application = require('../models/Application');

// Get all jobs with filtering and pagination
const getAllJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Build query
        let query = Job.findWithFilters(req.query);
        
        const jobs = await query
            .skip(skip)
            .limit(limit);

        const total = await Job.countDocuments(query.getQuery());
        const totalPages = Math.ceil(total / limit);

        // Get filter options for the form
        const categories = await Job.distinct('category', { status: 'active', applicationDeadline: { $gte: new Date() } });
        const locations = await Job.distinct('location', { status: 'active', applicationDeadline: { $gte: new Date() } });
        const jobTypes = await Job.distinct('jobType', { status: 'active', applicationDeadline: { $gte: new Date() } });
        const workModes = await Job.distinct('workMode', { status: 'active', applicationDeadline: { $gte: new Date() } });

        res.render('jobs/index', {
            title: 'Browse Jobs',
            page: 'jobs',
            jobs,
            categories,
            locations,
            jobTypes,
            workModes,
            filters: req.query,
            pagination: {
                currentPage: page,
                totalPages,
                totalJobs: total,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                pages: Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    const startPage = Math.max(1, Math.min(page - 4, totalPages - 9));
                    return startPage + i;
                }).filter(p => p <= totalPages)
            }
        });
    } catch (error) {
        console.error('Get all jobs error:', error);
        req.flash('error', 'Could not load jobs');
        res.redirect('/');
    }
};

// Get single job details
const getJobDetails = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job || job.status !== 'active' || new Date() > job.applicationDeadline) {
            req.flash('error', 'Job not found or no longer available');
            return res.redirect('/jobs');
        }

        // Increment view count
        await job.incrementViewCount();

        // Check if user has already applied (if logged in)
        let hasApplied = false;
        let userApplication = null;
        if (req.session.userId) {
            userApplication = await Application.findOne({
                job: job._id,
                applicant: req.session.userId
            });
            hasApplied = !!userApplication;
        }

        // Get related jobs
        const relatedJobs = await Job.find({
            category: job.category,
            _id: { $ne: job._id },
            status: 'active',
            applicationDeadline: { $gte: new Date() }
        })
        .limit(4)
        .sort({ featured: -1, createdAt: -1 });

        res.render('jobs/show', {
            title: job.title,
            page: 'job-details',
            job,
            relatedJobs,
            hasApplied,
            userApplication
        });
    } catch (error) {
        console.error('Get job details error:', error);
        req.flash('error', 'Could not load job details');
        res.redirect('/jobs');
    }
};

// Search jobs
const searchJobs = async (req, res) => {
    try {
        const { q, location, category, jobType, workMode, experienceLevel } = req.query;
        
        if (!q && !location && !category && !jobType && !workMode && !experienceLevel) {
            return res.redirect('/jobs');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        let query = Job.find({ 
            status: 'active', 
            applicationDeadline: { $gte: new Date() } 
        });

        // Text search
        if (q) {
            query = query.find({ $text: { $search: q } });
        }

        // Apply filters
        if (location) {
            query = query.find({ location: new RegExp(location, 'i') });
        }
        if (category) {
            query = query.find({ category });
        }
        if (jobType) {
            query = query.find({ jobType });
        }
        if (workMode) {
            query = query.find({ workMode });
        }
        if (experienceLevel) {
            query = query.find({ experienceLevel });
        }

        const jobs = await query
            .sort({ featured: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Job.countDocuments(query.getQuery());
        const totalPages = Math.ceil(total / limit);

        res.render('jobs/search', {
            title: `Search Results${q ? ` for "${q}"` : ''}`,
            page: 'search',
            jobs,
            searchQuery: q,
            filters: req.query,
            pagination: {
                currentPage: page,
                totalPages,
                totalJobs: total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Search jobs error:', error);
        req.flash('error', 'Search failed');
        res.redirect('/jobs');
    }
};

// Get jobs by category
const getJobsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        const jobs = await Job.find({ 
            category: new RegExp(category, 'i'), 
            status: 'active',
            applicationDeadline: { $gte: new Date() }
        })
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const total = await Job.countDocuments({ 
            category: new RegExp(category, 'i'), 
            status: 'active',
            applicationDeadline: { $gte: new Date() }
        });
        const totalPages = Math.ceil(total / limit);

        res.render('jobs/category', {
            title: `${category} Jobs`,
            page: 'category',
            jobs,
            category,
            pagination: {
                currentPage: page,
                totalPages,
                totalJobs: total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get jobs by category error:', error);
        req.flash('error', 'Could not load category jobs');
        res.redirect('/jobs');
    }
};

// Get featured jobs for homepage
const getFeaturedJobs = async (limit = 6) => {
    try {
        return await Job.find({ 
            featured: true, 
            status: 'active',
            applicationDeadline: { $gte: new Date() }
        })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
        console.error('Get featured jobs error:', error);
        return [];
    }
};

// Get latest jobs
const getLatestJobs = async (limit = 8) => {
    try {
        return await Job.find({ 
            status: 'active',
            applicationDeadline: { $gte: new Date() }
        })
            .sort({ createdAt: -1 })
            .limit(limit);
    } catch (error) {
        console.error('Get latest jobs error:', error);
        return [];
    }
};

// Get recommended jobs for user
const getRecommendedJobs = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            req.flash('error', 'Please log in to view recommendations');
            return res.redirect('/auth/login');
        }

        const criteria = user.getJobRecommendationCriteria();
        
        // Get recommended jobs based on user profile
        let recommendedJobs = [];
        if (Object.keys(criteria).length > 0) {
            recommendedJobs = await Job.getRecommendedJobs(criteria, 20);
        }

        // If not enough recommended jobs, fill with latest jobs
        if (recommendedJobs.length < 10) {
            const latestJobs = await Job.find({
                status: 'active',
                applicationDeadline: { $gte: new Date() },
                _id: { $nin: recommendedJobs.map(job => job._id) }
            })
            .sort({ createdAt: -1 })
            .limit(10 - recommendedJobs.length);
            
            recommendedJobs = recommendedJobs.concat(latestJobs);
        }

        // Check which jobs user has already applied to
        const applicationIds = await Application.find({
            applicant: user._id
        }).distinct('job');

        recommendedJobs = recommendedJobs.map(job => ({
            ...job.toObject(),
            hasApplied: applicationIds.some(appJobId => appJobId.toString() === job._id.toString())
        }));

        res.render('jobs/recommended', {
            title: 'Recommended Jobs',
            page: 'recommended',
            jobs: recommendedJobs,
            user
        });

    } catch (error) {
        console.error('Get recommended jobs error:', error);
        req.flash('error', 'Could not load recommended jobs');
        res.redirect('/jobs');
    }
};

// Get job statistics
const getJobStats = async () => {
    try {
        const totalJobs = await Job.countDocuments({ 
            status: 'active',
            applicationDeadline: { $gte: new Date() }
        });
        const totalCompanies = (await Job.distinct('company', { 
            status: 'active',
            applicationDeadline: { $gte: new Date() }
        })).length;
        const totalApplications = await Application.countDocuments();
        
        const categoryCounts = await Job.aggregate([
            { $match: { status: 'active', applicationDeadline: { $gte: new Date() } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ]);

        return {
            totalJobs,
            totalCompanies,
            totalApplications,
            topCategories: categoryCounts
        };
    } catch (error) {
        console.error('Get job stats error:', error);
        return {
            totalJobs: 0,
            totalCompanies: 0,
            totalApplications: 0,
            topCategories: []
        };
    }
};

module.exports = {
    getAllJobs,
    getJobDetails,
    searchJobs,
    getJobsByCategory,
    getFeaturedJobs,
    getLatestJobs,
    getRecommendedJobs,
    getJobStats
};
