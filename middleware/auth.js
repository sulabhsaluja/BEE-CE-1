const User = require('../models/User');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    console.log('=== REQUIRE AUTH MIDDLEWARE ===');
    console.log('URL:', req.originalUrl);
    console.log('Session exists:', !!req.session);
    console.log('User ID:', req.session?.userId);
    
    if (req.session && req.session.userId) {
        return next();
    } else {
        req.flash('error', 'Please log in to access this page');
        return res.redirect('/auth/login');
    }
};

// Middleware to check if user is a guest (not authenticated)
const requireGuest = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    } else {
        return next();
    }
};

// Middleware to set current user in res.locals for templates
const setCurrentUser = async (req, res, next) => {
    try {
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            res.locals.currentUser = user;
            res.locals.isAuthenticated = true;
        } else {
            res.locals.currentUser = null;
            res.locals.isAuthenticated = false;
        }
        next();
    } catch (error) {
        console.error('Error in setCurrentUser middleware:', error);
        res.locals.currentUser = null;
        res.locals.isAuthenticated = false;
        next();
    }
};

// Middleware to set locals for all templates
const setLocals = async (req, res, next) => {
    try {
        // Set flash messages
        res.locals.messages = {
            success: req.flash('success'),
            error: req.flash('error'),
            info: req.flash('info'),
            warning: req.flash('warning')
        };

        // Set current user and authentication status
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            res.locals.currentUser = user;
            res.locals.isAuthenticated = true;
        } else {
            res.locals.currentUser = null;
            res.locals.isAuthenticated = false;
        }

        // Set environment
        res.locals.NODE_ENV = process.env.NODE_ENV || 'development';

        // Set current URL for navigation
        res.locals.currentUrl = req.originalUrl;
        res.locals.currentPath = req.path;

        // Helper functions for templates
        res.locals.formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        res.locals.formatDateTime = (date) => {
            return new Date(date).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        res.locals.timeAgo = (date) => {
            const now = new Date();
            const diff = now - new Date(date);
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            return 'Just now';
        };

        res.locals.truncate = (text, length = 100) => {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        };

        res.locals.capitalize = (text) => {
            if (!text) return '';
            return text.charAt(0).toUpperCase() + text.slice(1);
        };

        res.locals.pluralize = (count, singular, plural) => {
            return count === 1 ? singular : (plural || singular + 's');
        };

        res.locals.formatSalary = (salary) => {
            if (!salary || (!salary.min && !salary.max)) {
                return 'Salary not specified';
            }
            
            const formatAmount = (amount) => {
                if (salary.currency === 'INR') {
                    return `₹${amount.toLocaleString('en-IN')}`;
                } else if (salary.currency === 'USD') {
                    return `$${amount.toLocaleString('en-US')}`;
                } else {
                    return `${salary.currency} ${amount.toLocaleString()}`;
                }
            };
            
            if (salary.min && salary.max) {
                return `${formatAmount(salary.min)} - ${formatAmount(salary.max)} ${salary.period}`;
            } else if (salary.min) {
                return `${formatAmount(salary.min)}+ ${salary.period}`;
            } else {
                return `Up to ${formatAmount(salary.max)} ${salary.period}`;
            }
        };

        next();
    } catch (error) {
        console.error('Error in setLocals middleware:', error);
        res.locals.messages = { success: [], error: [], info: [], warning: [] };
        res.locals.currentUser = null;
        res.locals.isAuthenticated = false;
        res.locals.currentUrl = req.originalUrl;
        res.locals.currentPath = req.path;
        next();
    }
};

// Middleware to check profile completion
const checkProfileCompletion = async (req, res, next) => {
    try {
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (user && !user.isProfileComplete) {
                // Allow access to profile completion pages and logout
                if (req.path.includes('/profile') || req.path.includes('/logout') || req.path === '/') {
                    return next();
                }
                
                req.flash('warning', 'Please complete your profile to access all features.');
                return res.redirect('/profile');
            }
        }
        next();
    } catch (error) {
        console.error('Profile completion check error:', error);
        next();
    }
};

// Middleware to load user data for authenticated routes
const loadUser = async (req, res, next) => {
    try {
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (!user) {
                req.session.destroy();
                req.flash('error', 'User not found. Please log in again.');
                return res.redirect('/auth/login');
            }
            req.user = user;
        }
        next();
    } catch (error) {
        console.error('Load user error:', error);
        req.flash('error', 'Error loading user data');
        res.redirect('/auth/login');
    }
};

module.exports = {
    requireAuth,
    requireGuest,
    setCurrentUser,
    setLocals,
    checkProfileCompletion,
    loadUser
};
