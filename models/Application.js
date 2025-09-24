const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    // Job and applicant references
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: [true, 'Job reference is required']
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Applicant reference is required']
    },
    
    // Application details
    coverLetter: {
        type: String,
        required: [true, 'Cover letter is required'],
        maxlength: [1500, 'Cover letter cannot exceed 1500 characters']
    },
    resume: {
        type: String, // Store file path or URL
        required: false
    },
    
    // Additional application data
    expectedSalary: {
        type: Number,
        min: [0, 'Expected salary cannot be negative']
    },
    availableFrom: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value >= new Date();
            },
            message: 'Available from date cannot be in the past'
        }
    },
    noticePeriod: {
        type: String,
        enum: ['Immediate', '15 days', '1 month', '2 months', '3 months', 'Other']
    },
    
    // Application status tracking
    status: {
        type: String,
        default: 'submitted',
        enum: [
            'submitted',      // Just submitted
            'under-review',   // Employer is reviewing
            'shortlisted',    // Moved to next round
            'interview',      // Interview scheduled
            'selected',       // Job offered
            'rejected',       // Application rejected
            'withdrawn'       // Applicant withdrew
        ]
    },
    
    // Status history for tracking changes
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    
    // Interview details (for job seekers to view)
    interview: {
        scheduled: {
            type: Boolean,
            default: false
        },
        dateTime: Date,
        mode: {
            type: String,
            enum: ['In-person', 'Video Call', 'Phone Call']
        },
        location: String,
        meetingLink: String,
        instructions: String,
        feedback: String
    },
    
    // Application metadata
    applicationSource: {
        type: String,
        default: 'direct',
        enum: ['direct', 'referral', 'job-board', 'social-media', 'other']
    },
    referralSource: String,
    
    // Questionnaire responses (if job has custom questions)
    questionnaire: [{
        question: String,
        answer: String
    }],
    
    // Tracking fields
    viewedByEmployer: {
        type: Boolean,
        default: false
    },
    viewedAt: Date,
    responseDate: Date, // When employer responded
    
    // Follow-up tracking
    lastFollowUp: Date,
    followUpCount: {
        type: Number,
        default: 0
    },
    
    // Application notes (private to job seeker)
    personalNotes: {
        type: String,
        maxlength: [1000, 'Personal notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ applicant: 1, status: 1 });

// Virtual for application age
applicationSchema.virtual('applicationAge').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return hours < 1 ? 'Just now' : `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 30) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        const months = Math.floor(days / 30);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
});

// Virtual for status badge color
applicationSchema.virtual('statusBadgeColor').get(function() {
    const statusColors = {
        'submitted': 'primary',
        'under-review': 'info',
        'shortlisted': 'warning',
        'interview': 'warning',
        'selected': 'success',
        'rejected': 'danger',
        'withdrawn': 'secondary'
    };
    return statusColors[this.status] || 'secondary';
});

// Virtual for status display name
applicationSchema.virtual('statusDisplayName').get(function() {
    const statusNames = {
        'submitted': 'Submitted',
        'under-review': 'Under Review',
        'shortlisted': 'Shortlisted',
        'interview': 'Interview Scheduled',
        'selected': 'Selected',
        'rejected': 'Not Selected',
        'withdrawn': 'Withdrawn'
    };
    return statusNames[this.status] || this.status;
});

// Pre-save middleware to add status to history
applicationSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date()
        });
        
        if (this.status !== 'submitted' && !this.responseDate) {
            this.responseDate = new Date();
        }
    }
    
    // Initialize status history on creation
    if (this.isNew && this.statusHistory.length === 0) {
        this.statusHistory.push({
            status: 'submitted',
            changedAt: new Date()
        });
    }
    
    next();
});

// Method to check if application can be withdrawn
applicationSchema.methods.canWithdraw = function() {
    return ['submitted', 'under-review', 'shortlisted'].includes(this.status);
};

// Method to withdraw application
applicationSchema.methods.withdraw = function(reason = '') {
    if (!this.canWithdraw()) {
        throw new Error('Application cannot be withdrawn at this stage');
    }
    
    this.status = 'withdrawn';
    this.statusHistory.push({
        status: 'withdrawn',
        changedAt: new Date(),
        notes: reason || 'Application withdrawn by candidate'
    });
    
    return this.save();
};

// Method to add personal notes
applicationSchema.methods.addPersonalNote = function(note) {
    this.personalNotes = note;
    return this.save();
};

// Method to record follow-up
applicationSchema.methods.recordFollowUp = function() {
    this.lastFollowUp = new Date();
    this.followUpCount += 1;
    return this.save();
};

// Method to check if follow-up is needed
applicationSchema.methods.needsFollowUp = function(days = 14) {
    if (['rejected', 'selected', 'withdrawn'].includes(this.status)) {
        return false;
    }
    
    const lastActivity = this.responseDate || this.lastFollowUp || this.createdAt;
    const daysSinceActivity = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));
    
    return daysSinceActivity >= days;
};

// Static method to get applications with filters
applicationSchema.statics.findWithFilters = function(filters = {}) {
    let query = this.find();
    
    if (filters.applicant) {
        query = query.find({ applicant: filters.applicant });
    }
    
    if (filters.job) {
        query = query.find({ job: filters.job });
    }
    
    if (filters.status) {
        if (Array.isArray(filters.status)) {
            query = query.find({ status: { $in: filters.status } });
        } else {
            query = query.find({ status: filters.status });
        }
    }
    
    if (filters.dateRange) {
        if (filters.dateRange.from) {
            query = query.find({ createdAt: { $gte: new Date(filters.dateRange.from) } });
        }
        if (filters.dateRange.to) {
            query = query.find({ createdAt: { $lte: new Date(filters.dateRange.to) } });
        }
    }
    
    if (filters.needsFollowUp) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 14);
        
        query = query.find({
            status: { $in: ['submitted', 'under-review', 'shortlisted', 'interview'] },
            $or: [
                { responseDate: null, createdAt: { $lte: cutoffDate } },
                { responseDate: { $lte: cutoffDate }, lastFollowUp: { $lte: cutoffDate } }
            ]
        });
    }
    
    return query.sort({ createdAt: -1 });
};

// Static method to get application statistics for a user
applicationSchema.statics.getUserStats = async function(userId) {
    const stats = await this.aggregate([
        { $match: { applicant: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const result = {
        total: 0,
        submitted: 0,
        'under-review': 0,
        shortlisted: 0,
        interview: 0,
        selected: 0,
        rejected: 0,
        withdrawn: 0
    };
    
    stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
    });
    
    // Calculate success rate
    result.responseRate = result.total > 0 ? 
        Math.round((result['under-review'] + result.shortlisted + result.interview + result.selected) / result.total * 100) : 0;
    
    result.successRate = result.total > 0 ? 
        Math.round(result.selected / result.total * 100) : 0;
    
    return result;
};

module.exports = mongoose.model('Application', applicationSchema);
