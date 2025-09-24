const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// Get user dashboard
const getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        // Get application statistics
        const applicationStats = await Application.getUserStats(req.session.userId);

        // Get recent applications (last 5)
        const recentApplications = await Application.find({ applicant: req.session.userId })
            .populate('job', 'title company location')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get recommended jobs based on profile
        const criteria = user.getJobRecommendationCriteria();
        let recommendedJobs = [];
        
        if (Object.keys(criteria).length > 0) {
            recommendedJobs = await Job.getRecommendedJobs(criteria, 6);
        }
        
        // If no recommendations, show latest jobs
        if (recommendedJobs.length === 0) {
            recommendedJobs = await Job.find({ 
                status: 'active',
                applicationDeadline: { $gte: new Date() }
            })
            .sort({ createdAt: -1 })
            .limit(6);
        }

        // Get jobs user hasn't applied to yet
        const applicationJobIds = await Application.find({
            applicant: req.session.userId
        }).distinct('job');

        const availableJobs = recommendedJobs.filter(job => 
            !applicationJobIds.some(appJobId => appJobId.toString() === job._id.toString())
        );

        // Get applications that need follow-up
        const followUpApplications = await Application.find({
            applicant: req.session.userId,
            status: { $in: ['submitted', 'under-review', 'shortlisted', 'interview'] },
            $expr: {
                $gte: [
                    { $subtract: [new Date(), { $ifNull: ['$responseDate', '$createdAt'] }] },
                    14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
                ]
            }
        }).countDocuments();

        // Get upcoming interviews
        const upcomingInterviews = await Application.find({
            applicant: req.session.userId,
            'interview.scheduled': true,
            'interview.dateTime': { $gte: new Date() },
            status: 'interview'
        })
        .populate('job', 'title company')
        .sort({ 'interview.dateTime': 1 })
        .limit(3);

        // Recent activity feed
        const activityItems = [];
        
        // Add recent applications to activity
        recentApplications.slice(0, 3).forEach(app => {
            activityItems.push({
                type: 'application',
                action: 'applied',
                title: `Applied for ${app.job.title}`,
                subtitle: `at ${app.job.company}`,
                date: app.createdAt,
                link: `/applications/${app._id}`,
                icon: 'fas fa-paper-plane',
                color: 'primary'
            });
        });

        // Add status updates to activity
        const statusUpdates = await Application.find({ 
            applicant: req.session.userId,
            statusHistory: { $exists: true, $not: { $size: 0 } }
        })
        .populate('job', 'title company')
        .sort({ updatedAt: -1 })
        .limit(3);

        statusUpdates.forEach(app => {
            const latestStatus = app.statusHistory[app.statusHistory.length - 1];
            if (latestStatus.status !== 'submitted') {
                activityItems.push({
                    type: 'status',
                    action: 'updated',
                    title: `Application status updated to ${app.statusDisplayName}`,
                    subtitle: `for ${app.job.title} at ${app.job.company}`,
                    date: latestStatus.changedAt,
                    link: `/applications/${app._id}`,
                    icon: 'fas fa-info-circle',
                    color: app.statusBadgeColor
                });
            }
        });

        // Sort activity by date
        activityItems.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.render('user/dashboard', {
            title: 'Dashboard',
            page: 'dashboard',
            user,
            applicationStats,
            recentApplications,
            recommendedJobs: availableJobs.slice(0, 6),
            followUpCount: followUpApplications,
            upcomingInterviews,
            activityItems: activityItems.slice(0, 8),
            profileCompletion: user.profileCompletionPercentage
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        req.flash('error', 'Could not load dashboard');
        res.redirect('/');
    }
};

// Get profile completion suggestions
const getProfileSuggestions = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const suggestions = [];

        if (!user.phone) {
            suggestions.push({
                field: 'phone',
                message: 'Add your phone number to help employers contact you',
                action: 'Add Phone Number',
                link: '/profile'
            });
        }

        if (!user.location) {
            suggestions.push({
                field: 'location',
                message: 'Add your location to find relevant job opportunities',
                action: 'Add Location',
                link: '/profile'
            });
        }

        if (!user.bio) {
            suggestions.push({
                field: 'bio',
                message: 'Write a compelling bio to showcase your personality',
                action: 'Add Bio',
                link: '/profile'
            });
        }

        if (!user.resume) {
            suggestions.push({
                field: 'resume',
                message: 'Upload your resume to apply for jobs',
                action: 'Upload Resume',
                link: '/profile'
            });
        }

        if (!user.skills || user.skills.length === 0) {
            suggestions.push({
                field: 'skills',
                message: 'Add your skills to get better job recommendations',
                action: 'Add Skills',
                link: '/profile'
            });
        }

        if (!user.experience) {
            suggestions.push({
                field: 'experience',
                message: 'Specify your experience level',
                action: 'Add Experience',
                link: '/profile'
            });
        }

        if (!user.education || !user.education.degree) {
            suggestions.push({
                field: 'education',
                message: 'Add your educational background',
                action: 'Add Education',
                link: '/profile'
            });
        }

        if (!user.linkedIn && !user.github) {
            suggestions.push({
                field: 'social',
                message: 'Add your LinkedIn or GitHub profile',
                action: 'Add Social Links',
                link: '/profile'
            });
        }

        res.json({
            suggestions,
            completionPercentage: user.profileCompletionPercentage
        });

    } catch (error) {
        console.error('Profile suggestions error:', error);
        res.status(500).json({ error: 'Could not load suggestions' });
    }
};

module.exports = {
    getDashboard,
    getProfileSuggestions
};
