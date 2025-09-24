const { validationResult } = require('express-validator');
const User = require('../models/User');

// Show login page
const showLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Login to InternSpot',
        page: 'login'
    });
};

// Handle login
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/login', {
                title: 'Login to InternSpot',
                page: 'login',
                errors: errors.array(),
                formData: req.body
            });
        }

        const { email, password, rememberMe } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.isActive) {
            return res.render('auth/login', {
                title: 'Login to InternSpot',
                page: 'login',
                errors: [{ msg: 'Invalid email or password' }],
                formData: req.body
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.render('auth/login', {
                title: 'Login to InternSpot',
                page: 'login',
                errors: [{ msg: 'Invalid email or password' }],
                formData: req.body
            });
        }

        // Create session
        req.session.userId = user._id;
        
        // Set remember me
        if (rememberMe) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        req.flash('success', `Welcome back, ${user.name}!`);
        
        // Redirect to dashboard or intended page
        const redirectTo = req.session.returnTo || '/dashboard';
        delete req.session.returnTo;
        res.redirect(redirectTo);
        
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/auth/login');
    }
};

// Show register page
const showRegister = (req, res) => {
    res.render('auth/register', {
        title: 'Join InternSpot',
        page: 'register'
    });
};

// Handle registration
const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/register', {
                title: 'Join InternSpot',
                page: 'register',
                errors: errors.array(),
                formData: req.body
            });
        }

        const { name, email, password, agreeTerms } = req.body;

        // Check if terms are agreed
        if (!agreeTerms) {
            return res.render('auth/register', {
                title: 'Join InternSpot',
                page: 'register',
                errors: [{ msg: 'You must agree to the terms and conditions' }],
                formData: req.body
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.render('auth/register', {
                title: 'Join InternSpot',
                page: 'register',
                errors: [{ msg: 'An account with this email already exists' }],
                formData: req.body
            });
        }

        // Create new user
        const userData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password
        };

        const user = new User(userData);
        await user.save();

        // Auto login after registration
        req.session.userId = user._id;

        req.flash('success', 'Account created successfully! Please complete your profile to get better job recommendations.');
        res.redirect('/profile');
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({ msg: err.message }));
            return res.render('auth/register', {
                title: 'Join InternSpot',
                page: 'register',
                errors,
                formData: req.body
            });
        }

        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/auth/register');
    }
};

// Handle logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            req.flash('error', 'Could not log out properly');
        } else {
            req.flash('success', 'You have been logged out successfully');
        }
        res.redirect('/');
    });
};

// Show forgot password page
const showForgotPassword = (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Forgot Password',
        page: 'forgot-password'
    });
};

// Handle forgot password
const forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/forgot-password', {
                title: 'Forgot Password',
                page: 'forgot-password',
                errors: errors.array(),
                formData: req.body
            });
        }

        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        // Don't reveal if user exists or not for security
        req.flash('info', 'If an account with that email exists, you will receive password reset instructions.');
        res.redirect('/auth/forgot-password');

        // TODO: Implement email sending logic here
        if (user) {
            console.log(`Password reset requested for user: ${user.email}`);
            // Generate reset token and send email
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/auth/forgot-password');
    }
};

// Show change password page
const showChangePassword = (req, res) => {
    res.render('auth/change-password', {
        title: 'Change Password',
        page: 'change-password'
    });
};

// Handle change password
const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/change-password', {
                title: 'Change Password',
                page: 'change-password',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.render('auth/change-password', {
                title: 'Change Password',
                page: 'change-password',
                errors: [{ msg: 'Current password is incorrect' }]
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        req.flash('success', 'Password changed successfully');
        res.redirect('/dashboard');
        
    } catch (error) {
        console.error('Change password error:', error);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/auth/change-password');
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        res.render('user/profile', {
            title: 'My Profile',
            page: 'profile',
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        req.flash('error', 'Could not load profile');
        res.redirect('/dashboard');
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        if (!errors.isEmpty()) {
            return res.render('user/profile', {
                title: 'My Profile',
                page: 'profile',
                user,
                errors: errors.array(),
                formData: req.body
            });
        }

        const { 
            name, email, phone, location, bio, 
            skills, experience, degree, institution, year, 
            linkedIn, github, 
            desiredSalaryMin, desiredSalaryMax,
            preferredLocations, preferredJobTypes, 
            preferredWorkModes, preferredCategories
        } = req.body;
        
        // Check if email is already taken by another user
        if (email !== user.email) {
            const existingUser = await User.findOne({ 
                email: email.toLowerCase(),
                _id: { $ne: user._id }
            });
            
            if (existingUser) {
                return res.render('user/profile', {
                    title: 'My Profile',
                    page: 'profile',
                    user,
                    errors: [{ msg: 'Email is already taken by another user' }],
                    formData: req.body
                });
            }
        }

        // Update basic info
        user.name = name.trim();
        user.email = email.toLowerCase();
        user.phone = phone;
        user.location = location;
        user.bio = bio;

        // Update job seeker specific fields
        user.skills = skills ? skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [];
        user.experience = experience;
        user.education = {
            degree,
            institution,
            year: year ? parseInt(year) : undefined
        };
        user.linkedIn = linkedIn;
        user.github = github;

        // Update job preferences
        user.jobPreferences = {
            desiredSalaryMin: desiredSalaryMin ? parseInt(desiredSalaryMin) : undefined,
            desiredSalaryMax: desiredSalaryMax ? parseInt(desiredSalaryMax) : undefined,
            preferredLocations: preferredLocations ? 
                (Array.isArray(preferredLocations) ? preferredLocations : [preferredLocations]) : [],
            preferredJobTypes: preferredJobTypes ? 
                (Array.isArray(preferredJobTypes) ? preferredJobTypes : [preferredJobTypes]) : [],
            preferredWorkModes: preferredWorkModes ? 
                (Array.isArray(preferredWorkModes) ? preferredWorkModes : [preferredWorkModes]) : [],
            preferredCategories: preferredCategories ? 
                (Array.isArray(preferredCategories) ? preferredCategories : [preferredCategories]) : []
        };

        // Check and update profile completion
        user.checkProfileCompletion();
        
        await user.save();

        req.flash('success', 'Profile updated successfully!');
        res.redirect('/profile');
        
    } catch (error) {
        console.error('Update profile error:', error);
        req.flash('error', 'Could not update profile');
        res.redirect('/profile');
    }
};

module.exports = {
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
};
