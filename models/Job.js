const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true,
        maxlength: [100, 'Job title cannot exceed 100 characters']
    },
    company: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Job description is required'],
        maxlength: [2000, 'Job description cannot exceed 2000 characters']
    },
    requirements: {
        type: String,
        required: [true, 'Job requirements are required'],
        maxlength: [1500, 'Job requirements cannot exceed 1500 characters']
    },
    location: {
        type: String,
        required: [true, 'Job location is required'],
        trim: true
    },
    jobType: {
        type: String,
        required: [true, 'Job type is required'],
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
    },
    workMode: {
        type: String,
        required: [true, 'Work mode is required'],
        enum: ['On-site', 'Remote', 'Hybrid']
    },
    experienceLevel: {
        type: String,
        required: [true, 'Experience level is required'],
        enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive']
    },
    salary: {
        min: {
            type: Number,
            min: [0, 'Minimum salary cannot be negative']
        },
        max: {
            type: Number,
            min: [0, 'Maximum salary cannot be negative'],
            validate: {
                validator: function(value) {
                    return !this.salary.min || value >= this.salary.min;
                },
                message: 'Maximum salary must be greater than or equal to minimum salary'
            }
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'INR', 'EUR', 'GBP', 'CAD']
        },
        period: {
            type: String,
            default: 'annually',
            enum: ['hourly', 'monthly', 'annually']
        }
    },
    category: {
        type: String,
        required: [true, 'Job category is required'],
        enum: [
            'Technology',
            'Marketing',
            'Sales',
            'Design',
            'Finance',
            'Human Resources',
            'Operations',
            'Customer Service',
            'Healthcare',
            'Education',
            'Legal',
            'Manufacturing',
            'Other'
        ]
    },
    skills: [{
        type: String,
        trim: true
    }],
    benefits: [{
        type: String,
        trim: true
    }],
    applicationDeadline: {
        type: Date,
        required: [true, 'Application deadline is required'],
        validate: {
            validator: function(value) {
                return value > new Date();
            },
            message: 'Application deadline must be in the future'
        }
    },
    
    // Company information (for job seekers to view)
    companyEmail: {
        type: String,
        required: [true, 'Company email is required']
    },
    
    // Job status
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'paused', 'closed', 'draft']
    },
    
    // Application tracking
    totalApplications: {
        type: Number,
        default: 0,
        min: 0
    },
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Additional details
    companyDescription: {
        type: String,
        maxlength: [1000, 'Company description cannot exceed 1000 characters']
    },
    companyWebsite: {
        type: String,
        match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
    },
    companyLogo: {
        type: String // Store file path or URL
    },
    
    // SEO and search
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    featured: {
        type: Boolean,
        default: false
    },
    urgent: {
        type: Boolean,
        default: false
    },
    
    // Application process
    applicationProcess: {
        type: String,
        maxlength: [500, 'Application process cannot exceed 500 characters']
    },
    contactPerson: {
        name: String,
        email: String,
        phone: String
    },
    
    // External application URL (if not applying through the portal)
    externalApplicationUrl: {
        type: String,
        match: [/^https?:\/\/.+/, 'Please enter a valid application URL']
    }
}, {
    timestamps: true
});

// Indexes for better search performance
jobSchema.index({ title: 'text', description: 'text', skills: 'text', tags: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ workMode: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ featured: -1, createdAt: -1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ 'salary.min': 1, 'salary.max': 1 });

// Virtual for formatted salary
jobSchema.virtual('formattedSalary').get(function() {
    if (!this.salary || (!this.salary.min && !this.salary.max)) {
        return 'Salary not specified';
    }
    
    const formatAmount = (amount) => {
        if (this.salary.currency === 'INR') {
            return `₹${amount.toLocaleString('en-IN')}`;
        } else if (this.salary.currency === 'USD') {
            return `$${amount.toLocaleString('en-US')}`;
        } else {
            return `${this.salary.currency} ${amount.toLocaleString()}`;
        }
    };
    
    if (this.salary.min && this.salary.max) {
        return `${formatAmount(this.salary.min)} - ${formatAmount(this.salary.max)} ${this.salary.period}`;
    } else if (this.salary.min) {
        return `${formatAmount(this.salary.min)}+ ${this.salary.period}`;
    } else {
        return `Up to ${formatAmount(this.salary.max)} ${this.salary.period}`;
    }
});

// Virtual for time since posted
jobSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 30) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        const months = Math.floor(days / 30);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
});

// Virtual for days until deadline
jobSchema.virtual('daysUntilDeadline').get(function() {
    const now = new Date();
    const deadline = new Date(this.applicationDeadline);
    const diff = deadline - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
});

// Method to increment view count
jobSchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

// Method to increment application count
jobSchema.methods.incrementApplicationCount = function() {
    this.totalApplications += 1;
    return this.save();
};

// Method to check if job is still active and accepting applications
jobSchema.methods.isActive = function() {
    return this.status === 'active' && new Date() <= this.applicationDeadline;
};

// Static method to find jobs with filters
jobSchema.statics.findWithFilters = function(filters = {}) {
    let query = this.find({ status: 'active', applicationDeadline: { $gte: new Date() } });
    
    if (filters.search) {
        query = query.find({ $text: { $search: filters.search } });
    }
    
    if (filters.location) {
        query = query.find({ location: new RegExp(filters.location, 'i') });
    }
    
    if (filters.category) {
        query = query.find({ category: filters.category });
    }
    
    if (filters.jobType) {
        query = query.find({ jobType: filters.jobType });
    }
    
    if (filters.workMode) {
        query = query.find({ workMode: filters.workMode });
    }
    
    if (filters.experienceLevel) {
        query = query.find({ experienceLevel: filters.experienceLevel });
    }
    
    if (filters.salaryMin) {
        query = query.find({ 'salary.min': { $gte: parseInt(filters.salaryMin) } });
    }
    
    if (filters.salaryMax) {
        query = query.find({ 'salary.max': { $lte: parseInt(filters.salaryMax) } });
    }
    
    if (filters.skills && filters.skills.length > 0) {
        query = query.find({ skills: { $in: filters.skills } });
    }
    
    return query.sort({ featured: -1, createdAt: -1 });
};

// Static method to get recommended jobs for a user
jobSchema.statics.getRecommendedJobs = function(userCriteria, limit = 10) {
    const query = { status: 'active', applicationDeadline: { $gte: new Date() } };
    
    // Add user criteria to the query
    if (userCriteria.skills) {
        query.$or = query.$or || [];
        query.$or.push({ skills: userCriteria.skills });
    }
    
    if (userCriteria.experienceLevel) {
        query.experienceLevel = userCriteria.experienceLevel;
    }
    
    if (userCriteria.location) {
        query.$or = query.$or || [];
        query.$or.push({ location: userCriteria.location });
    }
    
    if (userCriteria.jobType) {
        query.jobType = userCriteria.jobType;
    }
    
    return this.find(query)
        .sort({ featured: -1, createdAt: -1 })
        .limit(limit);
};

module.exports = mongoose.model('Job', jobSchema);
