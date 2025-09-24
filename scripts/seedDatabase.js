const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Job = require('../models/Job');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected for seeding');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

// Sample job data
const sampleJobs = [
    {
        title: 'Frontend Developer',
        company: 'TechCorp Solutions',
        description: 'We are looking for a skilled Frontend Developer to join our dynamic team. You will be responsible for creating user-friendly web applications using modern frameworks like React and Vue.js. The ideal candidate should have a strong understanding of HTML, CSS, JavaScript, and responsive design principles.',
        requirements: 'Bachelor\'s degree in Computer Science or related field. 2+ years of experience with React/Vue.js, HTML5, CSS3, and JavaScript. Experience with responsive design and cross-browser compatibility. Knowledge of version control systems like Git.',
        location: 'San Francisco, CA',
        jobType: 'Full-time',
        workMode: 'Hybrid',
        experienceLevel: 'Mid Level',
        salary: {
            min: 80000,
            max: 110000,
            currency: 'USD',
            period: 'annually'
        },
        category: 'Technology',
        skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Git', 'Responsive Design'],
        benefits: ['Health Insurance', 'Dental Insurance', '401k Matching', 'Flexible PTO', 'Work From Home', 'Professional Development'],
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        companyEmail: 'hr@techcorp.com',
        status: 'active',
        featured: true,
        companyDescription: 'TechCorp Solutions is a leading technology company specializing in innovative web solutions.',
        companyWebsite: 'https://techcorp.com',
        applicationProcess: 'Submit your resume and portfolio. Selected candidates will go through a technical interview.',
        tags: ['frontend', 'react', 'javascript', 'web development'],
        contactPerson: {
            name: 'Sarah Johnson',
            email: 'sarah@techcorp.com',
            phone: '+1-555-0101'
        }
    },
    {
        title: 'Data Scientist',
        company: 'DataInsights Inc',
        description: 'Join our data science team to work on cutting-edge machine learning projects. Analyze large datasets, build predictive models, and provide insights that drive business decisions. Work with Python, R, and advanced analytics tools.',
        requirements: 'Master\'s degree in Data Science, Statistics, or related field. 3+ years of experience with Python, R, SQL. Strong background in machine learning algorithms and statistical analysis. Experience with big data technologies preferred.',
        location: 'New York, NY',
        jobType: 'Full-time',
        workMode: 'Remote',
        experienceLevel: 'Senior Level',
        salary: {
            min: 120000,
            max: 150000,
            currency: 'USD',
            period: 'annually'
        },
        category: 'Technology',
        skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'TensorFlow'],
        benefits: ['Stock Options', 'Health Insurance', 'Learning Budget', 'Flexible Hours', 'Home Office Setup'],
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        companyEmail: 'careers@datainsights.com',
        status: 'active',
        featured: true,
        companyDescription: 'DataInsights Inc helps businesses make data-driven decisions through advanced analytics.',
        companyWebsite: 'https://datainsights.com',
        applicationProcess: 'Submit resume with portfolio of data science projects. Technical assessment required.',
        tags: ['data science', 'python', 'machine learning', 'analytics'],
        contactPerson: {
            name: 'Michael Chen',
            email: 'michael@datainsights.com'
        }
    },
    {
        title: 'UX/UI Designer',
        company: 'Creative Studios',
        description: 'We are seeking a talented UX/UI Designer to create exceptional user experiences. Design intuitive interfaces for web and mobile applications, conduct user research, and collaborate with development teams to bring designs to life.',
        requirements: 'Bachelor\'s degree in Design, HCI, or related field. 2+ years of UX/UI design experience. Proficiency in Figma, Sketch, Adobe Creative Suite. Portfolio showcasing user-centered design process and problem-solving skills.',
        location: 'Los Angeles, CA',
        jobType: 'Full-time',
        workMode: 'On-site',
        experienceLevel: 'Mid Level',
        salary: {
            min: 70000,
            max: 95000,
            currency: 'USD',
            period: 'annually'
        },
        category: 'Design',
        skills: ['Figma', 'Sketch', 'Adobe Creative Suite', 'User Research', 'Wireframing', 'Prototyping'],
        benefits: ['Creative Workspace', 'Design Conference Budget', 'Health Insurance', 'Team Outings', 'Mentorship Program'],
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        companyEmail: 'design@creativestudios.com',
        status: 'active',
        companyDescription: 'Creative Studios is a premier design agency working with top brands worldwide.',
        companyWebsite: 'https://creativestudios.com',
        applicationProcess: 'Submit resume and portfolio showcasing your best UX/UI work.',
        tags: ['ux', 'ui', 'design', 'figma', 'user research'],
        contactPerson: {
            name: 'Emma Wilson',
            email: 'emma@creativestudios.com'
        }
    },
    {
        title: 'Marketing Specialist',
        company: 'GrowthMax Marketing',
        description: 'Drive marketing initiatives across multiple channels including social media, content marketing, and paid advertising. Create compelling campaigns, analyze performance metrics, and help grow our client base.',
        requirements: 'Bachelor\'s degree in Marketing, Communications, or related field. 1-3 years of digital marketing experience. Experience with Google Ads, Facebook Ads, and marketing analytics tools. Strong content creation skills.',
        location: 'Chicago, IL',
        jobType: 'Full-time',
        workMode: 'Hybrid',
        experienceLevel: 'Entry Level',
        salary: {
            min: 45000,
            max: 65000,
            currency: 'USD',
            period: 'annually'
        },
        category: 'Marketing',
        skills: ['Digital Marketing', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Analytics', 'Social Media'],
        benefits: ['Health Insurance', 'Professional Development', 'Flexible Schedule', 'Marketing Conference Access'],
        applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        companyEmail: 'jobs@growthmax.com',
        status: 'active',
        companyDescription: 'GrowthMax Marketing helps businesses scale through innovative digital marketing strategies.',
        companyWebsite: 'https://growthmax.com',
        applicationProcess: 'Submit resume with examples of successful marketing campaigns.',
        tags: ['marketing', 'digital', 'social media', 'advertising'],
        contactPerson: {
            name: 'David Rodriguez',
            email: 'david@growthmax.com',
            phone: '+1-555-0202'
        }
    },
    {
        title: 'Software Engineer Intern',
        company: 'StartupXYZ',
        description: '3-month summer internship program for computer science students. Work on real projects, learn from experienced developers, and gain hands-on experience with modern web technologies.',
        requirements: 'Currently pursuing Bachelor\'s degree in Computer Science. Knowledge of at least one programming language (Java, Python, JavaScript). Eager to learn and contribute. Strong problem-solving skills.',
        location: 'Austin, TX',
        jobType: 'Internship',
        workMode: 'On-site',
        experienceLevel: 'Entry Level',
        salary: {
            min: 20,
            max: 25,
            currency: 'USD',
            period: 'hourly'
        },
        category: 'Technology',
        skills: ['Java', 'Python', 'JavaScript', 'Problem Solving', 'Git'],
        benefits: ['Mentorship', 'Learning Opportunities', 'Team Activities', 'Potential Full-time Offer'],
        applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        companyEmail: 'internships@startupxyz.com',
        status: 'active',
        featured: true,
        urgent: true,
        companyDescription: 'StartupXYZ is a fast-growing tech startup building the future of e-commerce.',
        companyWebsite: 'https://startupxyz.com',
        applicationProcess: 'Submit resume and transcript. Brief technical interview for qualified candidates.',
        tags: ['internship', 'entry level', 'software engineering', 'startup'],
        contactPerson: {
            name: 'Jennifer Lee',
            email: 'jennifer@startupxyz.com'
        }
    },
    {
        title: 'DevOps Engineer',
        company: 'CloudTech Solutions',
        description: 'Manage and optimize our cloud infrastructure. Implement CI/CD pipelines, ensure system reliability, and support development teams with infrastructure needs. Work with AWS, Docker, and Kubernetes.',
        requirements: '4+ years of DevOps experience. Strong knowledge of AWS, Docker, Kubernetes. Experience with CI/CD tools like Jenkins or GitLab CI. Scripting skills in Python or Bash. Infrastructure as Code experience preferred.',
        location: 'Seattle, WA',
        jobType: 'Full-time',
        workMode: 'Remote',
        experienceLevel: 'Senior Level',
        salary: {
            min: 110000,
            max: 140000,
            currency: 'USD',
            period: 'annually'
        },
        category: 'Technology',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Python', 'Terraform', 'Linux'],
        benefits: ['Stock Options', 'Health Insurance', 'Tech Equipment', 'Certification Support', 'Flexible PTO'],
        applicationDeadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        companyEmail: 'devops@cloudtech.com',
        status: 'active',
        companyDescription: 'CloudTech Solutions provides enterprise cloud infrastructure and automation services.',
        companyWebsite: 'https://cloudtech.com',
        applicationProcess: 'Technical interview focusing on infrastructure automation and system design.',
        tags: ['devops', 'aws', 'kubernetes', 'infrastructure', 'automation'],
        contactPerson: {
            name: 'Robert Kim',
            email: 'robert@cloudtech.com'
        }
    },
    {
        title: 'Product Manager',
        company: 'InnovateApp',
        description: 'Lead product strategy and development for our mobile applications. Work with cross-functional teams to define product roadmaps, gather user feedback, and drive product growth.',
        requirements: 'Bachelor\'s degree in Business, Engineering, or related field. 3+ years of product management experience. Strong analytical skills and data-driven mindset. Experience with mobile app development lifecycle.',
        location: 'Boston, MA',
        jobType: 'Full-time',
        workMode: 'Hybrid',
        experienceLevel: 'Mid Level',
        salary: {
            min: 100000,
            max: 130000,
            currency: 'USD',
            period: 'annually'
        },
        category: 'Technology',
        skills: ['Product Management', 'Analytics', 'Mobile Apps', 'User Research', 'Roadmap Planning', 'Agile'],
        benefits: ['Equity Package', 'Health Insurance', 'Learning Budget', 'Flexible Hours', 'Team Retreats'],
        applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        companyEmail: 'product@innovateapp.com',
        status: 'active',
        companyDescription: 'InnovateApp creates innovative mobile solutions that improve people\'s daily lives.',
        companyWebsite: 'https://innovateapp.com',
        applicationProcess: 'Submit resume with examples of products you\'ve successfully launched.',
        tags: ['product management', 'mobile', 'analytics', 'strategy'],
        contactPerson: {
            name: 'Lisa Chang',
            email: 'lisa@innovateapp.com',
            phone: '+1-555-0303'
        }
    },
    {
        title: 'Customer Success Manager',
        company: 'SaaS Solutions Inc',
        description: 'Help our customers achieve success with our software platform. Provide onboarding, training, and ongoing support to ensure customer satisfaction and retention.',
        requirements: 'Bachelor\'s degree in Business or related field. 2+ years of customer service or account management experience. Strong communication skills. Experience with SaaS platforms preferred.',
        location: 'Denver, CO',
        jobType: 'Full-time',
        workMode: 'Remote',
        experienceLevel: 'Mid Level',
        salary: {
            min: 60000,
            max: 80000,
            currency: 'USD',
            period: 'annually'
        },
        category: 'Customer Service',
        skills: ['Customer Success', 'Account Management', 'Communication', 'SaaS', 'Problem Solving'],
        benefits: ['Health Insurance', 'Work From Home', 'Performance Bonuses', 'Professional Development'],
        applicationDeadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        companyEmail: 'success@saassolutions.com',
        status: 'active',
        companyDescription: 'SaaS Solutions Inc provides business automation software for small and medium enterprises.',
        companyWebsite: 'https://saassolutions.com',
        applicationProcess: 'Submit resume and cover letter highlighting customer service experience.',
        tags: ['customer success', 'saas', 'account management', 'support'],
        contactPerson: {
            name: 'Tom Anderson',
            email: 'tom@saassolutions.com'
        }
    }
];

// Create test user
const testUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'TestPassword123',
    phone: '5551234567',
    location: 'San Francisco, CA',
    bio: 'Passionate software developer with experience in modern web technologies. Always eager to learn and take on new challenges.',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
    experience: '1-3 years',
    education: {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of California, Berkeley',
        year: 2022
    },
    linkedIn: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    isEmailVerified: true,
    isActive: true,
    jobPreferences: {
        desiredSalaryMin: 70000,
        desiredSalaryMax: 100000,
        preferredLocations: ['San Francisco, CA', 'Remote'],
        preferredJobTypes: ['Full-time', 'Contract'],
        preferredWorkModes: ['Remote', 'Hybrid'],
        preferredCategories: ['Technology']
    }
};

// Function to seed jobs
const seedJobs = async () => {
    console.log('🌱 Seeding jobs...');
    
    try {
        // Clear existing jobs
        await Job.deleteMany({});
        console.log('🗑️  Cleared existing jobs');
        
        // Create jobs with some random stats
        const jobs = [];
        for (let i = 0; i < sampleJobs.length; i++) {
            const jobData = {
                ...sampleJobs[i],
                viewCount: Math.floor(Math.random() * 100) + 10,
                totalApplications: Math.floor(Math.random() * 20) + 1
            };
            
            const job = new Job(jobData);
            await job.save();
            jobs.push(job);
            console.log(`✅ Created job: ${job.title} at ${job.company}`);
        }
        
        console.log(`🎉 Successfully created ${jobs.length} job postings`);
        return jobs;
    } catch (error) {
        console.error('❌ Error seeding jobs:', error);
        throw error;
    }
};

// Function to seed test user
const seedUser = async () => {
    console.log('🌱 Creating test user...');
    
    try {
        // Clear existing test user
        await User.deleteOne({ email: testUser.email });
        
        const user = new User(testUser);
        
        // Check profile completion
        user.checkProfileCompletion();
        
        await user.save();
        
        console.log(`✅ Created test user: ${user.name} (${user.email})`);
        console.log(`📊 Profile completion: ${user.profileCompletionPercentage}%`);
        
        return user;
    } catch (error) {
        console.error('❌ Error creating test user:', error);
        throw error;
    }
};

// Main seeding function
const seedDatabase = async () => {
    try {
        console.log('🚀 Starting database seeding...');
        
        await connectDB();
        
        const jobs = await seedJobs();
        const user = await seedUser();
        
        console.log('\n📊 Seeding Summary:');
        console.log(`💼 Jobs: ${jobs.length}`);
        console.log(`👤 Test User: 1`);
        
        console.log('\n🎯 Test Login Credentials:');
        console.log(`📧 Email: ${testUser.email}`);
        console.log(`🔑 Password: ${testUser.password}`);
        
        console.log('\n✅ Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase, seedJobs, seedUser };
