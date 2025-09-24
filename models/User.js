const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    
    // Profile fields
    phone: {
        type: String,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
    },
    location: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    
    // Job seeker specific fields
    resume: {
        type: String, // Store file path or URL
    },
    skills: [{
        type: String,
        trim: true
    }],
    experience: {
        type: String,
        enum: ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5+ years']
    },
    education: {
        degree: String,
        institution: String,
        year: Number
    },
    
    // Profile completion and verification
    isProfileComplete: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    // Account status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Social links
    linkedIn: {
        type: String,
        match: [/^https?:\/\/.+/, 'Please enter a valid LinkedIn URL']
    },
    github: {
        type: String,
        match: [/^https?:\/\/.+/, 'Please enter a valid GitHub URL']
    },
    
    // Profile image
    profileImage: {
        type: String
    },
    
    // Preferences
    preferences: {
        jobAlerts: {
            type: Boolean,
            default: true
        },
        marketingEmails: {
            type: Boolean,
            default: false
        }
    },
    
    // Job preferences
    jobPreferences: {
        desiredSalaryMin: Number,
        desiredSalaryMax: Number,
        preferredLocations: [String],
        preferredJobTypes: [String],
        preferredWorkModes: [String],
        preferredCategories: [String]
    }
}, {
    timestamps: true
});

// Index for searching users
userSchema.index({ email: 1 });
userSchema.index({ location: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ experience: 1 });

// Virtual for full profile completion check
userSchema.virtual('profileCompletionPercentage').get(function() {
    let completed = 0;
    const total = 10;
    
    if (this.name) completed++;
    if (this.email) completed++;
    if (this.phone) completed++;
    if (this.location) completed++;
    if (this.bio) completed++;
    if (this.profileImage) completed++;
    if (this.resume) completed++;
    if (this.skills && this.skills.length > 0) completed++;
    if (this.experience) completed++;
    if (this.education && this.education.degree) completed++;
    
    return Math.round((completed / total) * 100);
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (remove sensitive data)
userSchema.methods.getPublicProfile = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

// Method to check if profile is complete
userSchema.methods.checkProfileCompletion = function() {
    const requiredFields = ['name', 'email', 'phone', 'location', 'resume', 'skills', 'experience'];
    
    const isComplete = requiredFields.every(field => {
        if (field === 'skills') {
            return this[field] && this[field].length > 0;
        }
        return this[field] && this[field].toString().trim().length > 0;
    });
    
    this.isProfileComplete = isComplete;
    return isComplete;
};

// Method to get recommended jobs based on profile
userSchema.methods.getJobRecommendationCriteria = function() {
    const criteria = {};
    
    if (this.skills && this.skills.length > 0) {
        criteria.skills = { $in: this.skills };
    }
    
    if (this.experience) {
        const expLevelMap = {
            'Fresher': ['Entry Level'],
            '0-1 years': ['Entry Level'],
            '1-3 years': ['Entry Level', 'Mid Level'],
            '3-5 years': ['Mid Level', 'Senior Level'],
            '5+ years': ['Senior Level', 'Executive']
        };
        criteria.experienceLevel = { $in: expLevelMap[this.experience] || [] };
    }
    
    if (this.jobPreferences) {
        if (this.jobPreferences.preferredLocations && this.jobPreferences.preferredLocations.length > 0) {
            criteria.location = { $in: this.jobPreferences.preferredLocations };
        }
        if (this.jobPreferences.preferredJobTypes && this.jobPreferences.preferredJobTypes.length > 0) {
            criteria.jobType = { $in: this.jobPreferences.preferredJobTypes };
        }
        if (this.jobPreferences.preferredWorkModes && this.jobPreferences.preferredWorkModes.length > 0) {
            criteria.workMode = { $in: this.jobPreferences.preferredWorkModes };
        }
        if (this.jobPreferences.preferredCategories && this.jobPreferences.preferredCategories.length > 0) {
            criteria.category = { $in: this.jobPreferences.preferredCategories };
        }
    }
    
    return criteria;
};

module.exports = mongoose.model('User', userSchema);
