const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const dotenv = require('dotenv');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const expressLayouts = require('express-ejs-layouts');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const mainRoutes = require('./routes/main');

// Import middleware
const { setLocals } = require('./middleware/auth');

// Import controllers
const { getFeaturedJobs, getLatestJobs } = require('./controllers/jobController');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy for rate limiting in production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Layout configuration
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        touchAfter: 24 * 3600, // lazy session update
        dbName: 'internspot_user'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax'
    },
    name: 'internspot.user.sid'
}));

// Flash messages
app.use(flash());

// Set local variables for templates
app.use(setLocals);

// Routes
app.get('/', async (req, res) => {
    try {
        const featuredJobs = await getFeaturedJobs(6);
        const latestJobs = await getLatestJobs(8);
        
        res.render('index', {
            title: 'InternSpot - Find Your Dream Job',
            page: 'home',
            featuredJobs,
            latestJobs
        });
    } catch (error) {
        console.error('Homepage error:', error);
        res.render('index', {
            title: 'InternSpot - Find Your Dream Job',
            page: 'home',
            featuredJobs: [],
            latestJobs: []
        });
    }
});

// Main routes (dashboard, profile)
app.use('/', mainRoutes);

// Authentication routes with rate limiting
app.use('/auth', authLimiter, authRoutes);

// Job routes
app.use('/jobs', jobRoutes);

// Application routes
app.use('/applications', applicationRoutes);

// About and Contact pages
app.get('/about', (req, res) => {
    res.render('pages/about', {
        title: 'About InternSpot',
        page: 'about'
    });
});

app.get('/contact', (req, res) => {
    res.render('pages/contact', {
        title: 'Contact Us',
        page: 'contact'
    });
});

app.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Here you would typically send an email or save to database
        console.log('Contact form submission:', { name, email, subject, message });
        
        req.flash('success', 'Thank you for your message. We\'ll get back to you soon!');
        res.redirect('/contact');
    } catch (error) {
        console.error('Contact form error:', error);
        req.flash('error', 'Failed to send message. Please try again.');
        res.redirect('/contact');
    }
});

// Privacy and Terms pages
app.get('/privacy', (req, res) => {
    res.render('pages/privacy', {
        title: 'Privacy Policy',
        page: 'privacy'
    });
});

app.get('/terms', (req, res) => {
    res.render('pages/terms', {
        title: 'Terms of Service',
        page: 'terms'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).render('pages/404', {
        title: 'Page Not Found',
        page: 'error'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        req.flash('error', errors.join(', '));
        return res.redirect('back');
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
        req.flash('error', 'This record already exists.');
        return res.redirect('back');
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
        req.flash('error', 'Invalid ID provided.');
        return res.redirect('/');
    }
    
    res.status(error.status || 500);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        res.json({
            error: {
                message: error.message,
                status: error.status || 500
            }
        });
    } else {
        res.render('pages/500', {
            title: 'Server Error',
            page: 'error',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 InternSpot User Portal running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;
