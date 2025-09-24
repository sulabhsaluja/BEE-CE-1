const { validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// Show application form
const showApplicationForm = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await Job.findById(jobId);

        if (!job || job.status !== 'active' || new Date() > job.applicationDeadline) {
            req.flash('error', 'Job not found or no longer accepting applications');
            return res.redirect('/jobs');
        }

        // Check if user already applied
        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: req.session.userId
        });

        if (existingApplication) {
            req.flash('info', 'You have already applied for this job');
            return res.redirect(`/applications/${existingApplication._id}`);
        }

        // Get user profile
        const user = await User.findById(req.session.userId);

        res.render('applications/apply', {
            title: `Apply for ${job.title}`,
            page: 'apply',
            job,
            user
        });

    } catch (error) {
        console.error('Show application form error:', error);
        req.flash('error', 'Could not load application form');
        res.redirect('/jobs');
    }
};

// Submit job application
const submitApplication = async (req, res) => {
    try {
        const errors = validationResult(req);
        const jobId = req.params.jobId;
        const job = await Job.findById(jobId);

        if (!job || job.status !== 'active' || new Date() > job.applicationDeadline) {
            req.flash('error', 'Job not found or no longer accepting applications');
            return res.redirect('/jobs');
        }

        // Check if user already applied
        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: req.session.userId
        });

        if (existingApplication) {
            req.flash('error', 'You have already applied for this job');
            return res.redirect(`/applications/${existingApplication._id}`);
        }

        if (!errors.isEmpty()) {
            const user = await User.findById(req.session.userId);
            return res.render('applications/apply', {
                title: `Apply for ${job.title}`,
                page: 'apply',
                job,
                user,
                errors: errors.array(),
                formData: req.body
            });
        }

        const {
            coverLetter,
            expectedSalary,
            availableFrom,
            noticePeriod,
            additionalInfo
        } = req.body;

        // Create application
        const applicationData = {
            job: jobId,
            applicant: req.session.userId,
            coverLetter,
            expectedSalary: expectedSalary ? parseFloat(expectedSalary) : undefined,
            availableFrom: availableFrom ? new Date(availableFrom) : undefined,
            noticePeriod,
            personalNotes: additionalInfo
        };

        // Use user's resume from profile
        const user = await User.findById(req.session.userId);
        if (user.resume) {
            applicationData.resume = user.resume;
        }

        const application = new Application(applicationData);
        await application.save();

        // Increment job application count
        await job.incrementApplicationCount();

        req.flash('success', 'Application submitted successfully! You can track its status in your dashboard.');
        res.redirect(`/applications/${application._id}`);

    } catch (error) {
        console.error('Submit application error:', error);
        req.flash('error', 'Could not submit application. Please try again.');
        res.redirect(`/jobs/${req.params.jobId}`);
    }
};

// Get all user applications
const getUserApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        let query = Application.findWithFilters({ 
            applicant: req.session.userId,
            status: status 
        });

        const applications = await query
            .populate('job', 'title company location jobType workMode salary applicationDeadline')
            .skip(skip)
            .limit(limit);

        const total = await Application.countDocuments(query.getQuery());
        const totalPages = Math.ceil(total / limit);

        // Get application statistics
        const stats = await Application.getUserStats(req.session.userId);

        res.render('applications/index', {
            title: 'My Applications',
            page: 'applications',
            applications,
            stats,
            currentStatus: status,
            pagination: {
                currentPage: page,
                totalPages,
                totalApplications: total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get user applications error:', error);
        req.flash('error', 'Could not load applications');
        res.redirect('/dashboard');
    }
};

// Get single application details
const getApplicationDetails = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('job', 'title company description requirements location jobType workMode salary applicationDeadline companyWebsite')
            .populate('applicant', 'name email phone location');

        if (!application) {
            req.flash('error', 'Application not found');
            return res.redirect('/applications');
        }

        // Check if user owns this application
        if (application.applicant._id.toString() !== req.session.userId) {
            req.flash('error', 'You can only view your own applications');
            return res.redirect('/applications');
        }

        res.render('applications/show', {
            title: `Application for ${application.job.title}`,
            page: 'application-details',
            application
        });

    } catch (error) {
        console.error('Get application details error:', error);
        req.flash('error', 'Could not load application details');
        res.redirect('/applications');
    }
};

// Withdraw application
const withdrawApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if user owns this application
        if (application.applicant.toString() !== req.session.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only withdraw your own applications'
            });
        }

        // Check if application can be withdrawn
        if (!application.canWithdraw()) {
            return res.status(400).json({
                success: false,
                message: 'Application cannot be withdrawn at this stage'
            });
        }

        const reason = req.body.reason || 'Application withdrawn by candidate';
        await application.withdraw(reason);

        res.json({
            success: true,
            message: 'Application withdrawn successfully'
        });

    } catch (error) {
        console.error('Withdraw application error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not withdraw application'
        });
    }
};

// Update personal notes for application
const updatePersonalNotes = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if user owns this application
        if (application.applicant.toString() !== req.session.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own applications'
            });
        }

        const { personalNotes } = req.body;
        await application.addPersonalNote(personalNotes);

        res.json({
            success: true,
            message: 'Notes updated successfully'
        });

    } catch (error) {
        console.error('Update personal notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not update notes'
        });
    }
};

// Record follow-up action
const recordFollowUp = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if user owns this application
        if (application.applicant.toString() !== req.session.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only follow up on your own applications'
            });
        }

        await application.recordFollowUp();

        res.json({
            success: true,
            message: 'Follow-up recorded successfully'
        });

    } catch (error) {
        console.error('Record follow-up error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not record follow-up'
        });
    }
};

// Get applications that need follow-up
const getFollowUpApplications = async (req, res) => {
    try {
        const applications = await Application.findWithFilters({ 
            applicant: req.session.userId,
            needsFollowUp: true
        })
        .populate('job', 'title company location');

        res.render('applications/follow-up', {
            title: 'Follow-up Required',
            page: 'follow-up',
            applications
        });

    } catch (error) {
        console.error('Get follow-up applications error:', error);
        req.flash('error', 'Could not load follow-up applications');
        res.redirect('/applications');
    }
};

// Get application statistics for dashboard
const getApplicationStats = async (userId) => {
    try {
        return await Application.getUserStats(userId);
    } catch (error) {
        console.error('Get application stats error:', error);
        return {
            total: 0,
            submitted: 0,
            'under-review': 0,
            shortlisted: 0,
            interview: 0,
            selected: 0,
            rejected: 0,
            withdrawn: 0,
            responseRate: 0,
            successRate: 0
        };
    }
};

module.exports = {
    showApplicationForm,
    submitApplication,
    getUserApplications,
    getApplicationDetails,
    withdrawApplication,
    updatePersonalNotes,
    recordFollowUp,
    getFollowUpApplications,
    getApplicationStats
};
