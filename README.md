# 🧑‍💼 InternSpot User - Job Seeker Portal

A comprehensive job seeker portal built with Node.js, Express, EJS, and MongoDB. This application allows job seekers to browse job listings, apply for positions, and track their application status.

## 📸 Features

### For Job Seekers 🙋‍♂️
- **User Registration & Authentication**: Secure account creation with profile management
- **Profile Management**: Complete profile with skills, experience, and education
- **Job Search & Filtering**: Advanced search with filters by location, category, salary, etc.
- **Job Applications**: Apply to jobs with cover letters and track application status
- **Dashboard**: View applied jobs, application statistics, and recommendations
- **Personalized Recommendations**: Get job suggestions based on profile and preferences
- **Application Tracking**: Follow up on applications and manage personal notes

### General Features 🚀
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Real-time Notifications**: Flash messages and status updates
- **Security**: Input validation, rate limiting, and secure session management
- **Search & Filters**: Advanced search capabilities with multiple filters
- **SEO Optimized**: Search engine friendly URLs and meta tags

## 🛠️ Tech Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **EJS**: Templating engine for server-side rendering

### Authentication & Security
- **bcryptjs**: Password hashing
- **express-session**: Session management with MongoDB store
- **express-validator**: Input validation and sanitization
- **helmet**: Security middleware
- **express-rate-limit**: Rate limiting

### Additional Libraries
- **moment**: Date/time manipulation
- **connect-flash**: Flash messages
- **method-override**: HTTP method override
- **morgan**: Logging middleware

## 📁 Project Structure

```
InternSpot User/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication and profile logic
│   ├── jobController.js     # Job browsing and searching
│   ├── applicationController.js # Job application management
│   └── dashboardController.js   # User dashboard
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── User.js              # User schema (job seekers)
│   ├── Job.js               # Job listings schema
│   └── Application.js       # Job applications schema
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── jobs.js              # Job browsing routes
│   ├── applications.js      # Application management routes
│   └── main.js              # Dashboard and profile routes
├── views/
│   ├── layouts/             # EJS layout templates
│   ├── partials/            # Reusable template components
│   ├── auth/                # Authentication pages
│   ├── jobs/                # Job listing and detail pages
│   ├── applications/        # Application management pages
│   ├── user/                # User dashboard and profile pages
│   └── pages/               # Static pages
├── scripts/
│   └── seedDatabase.js      # Database seeding script
├── server.js                # Main application entry point
├── package.json             # Project dependencies and scripts
├── .env.example             # Environment variables template
└── README.md                # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "InternSpot User"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   copy .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017/internspot_user
   SESSION_SECRET=your-super-secret-session-key
   NODE_ENV=development
   PORT=3000
   ```

4. **Start MongoDB:**
   - For local MongoDB: `mongod`
   - For MongoDB Atlas: Ensure your cluster is running

5. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

6. **Run the application:**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

7. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

## 🎯 Test Account

After running the seed script, you can use this test account:

- **Email:** john.doe@example.com
- **Password:** TestPassword123

## 📖 API Endpoints

### Authentication
- `GET /auth/login` - Show login page
- `POST /auth/login` - Handle login
- `GET /auth/register` - Show registration page
- `POST /auth/register` - Handle registration
- `POST /auth/logout` - Handle logout

### Jobs
- `GET /jobs` - Browse all jobs with filters
- `GET /jobs/search` - Search jobs
- `GET /jobs/recommended` - Get personalized job recommendations
- `GET /jobs/:id` - View job details

### Applications
- `GET /applications` - View user's applications
- `GET /applications/apply/:jobId` - Show application form
- `POST /applications/apply/:jobId` - Submit job application
- `GET /applications/:id` - View application details

### Dashboard & Profile
- `GET /dashboard` - User dashboard
- `GET /profile` - View/edit profile
- `POST /profile` - Update profile

## 🔧 Configuration

### Database Configuration
The application uses MongoDB with Mongoose. Configure your database connection in `.env`:

```env
MONGO_URI=mongodb://localhost:27017/internspot_user
# or for MongoDB Atlas:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/internspot_user
```

### Session Configuration
Sessions are stored in MongoDB using connect-mongo:

```env
SESSION_SECRET=your-super-secret-session-key-change-in-production
```

## 🚀 Deployment

### Prerequisites for Production
1. MongoDB Atlas account or dedicated MongoDB server
2. Node.js hosting service (Heroku, DigitalOcean, AWS, etc.)
3. Domain name (optional)

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=your-production-mongodb-uri
SESSION_SECRET=your-production-session-secret
PORT=80
```

### Deploy to Heroku
1. Create a Heroku app: `heroku create your-app-name`
2. Set environment variables: `heroku config:set MONGO_URI=your-uri`
3. Deploy: `git push heroku main`

## 🎭 Key Features Explained

### User Profile Management
- Complete profile with personal information, skills, and experience
- Profile completion tracking with percentage indicator
- Job preferences for personalized recommendations

### Job Search & Filtering
- Advanced search by keywords, location, category
- Filter by job type, work mode, experience level, salary range
- Pagination for large result sets

### Application Management
- Apply to jobs with personalized cover letters
- Track application status (submitted, under review, shortlisted, etc.)
- Personal notes and follow-up reminders
- Application statistics and success rates

### Dashboard
- Overview of application statistics
- Recent applications and status updates
- Personalized job recommendations
- Profile completion suggestions
- Activity timeline

## 🛡️ Security Features

- Password hashing with bcryptjs
- Session-based authentication
- Rate limiting for API endpoints
- Input validation and sanitization
- XSS protection
- CSRF protection through secure sessions
- Helmet.js for security headers

## 🔧 Development Scripts

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Seed database with sample data
npm run seed

# Create a test user
npm run create-user
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Express.js community for excellent documentation
- MongoDB team for robust database solutions
- EJS templating engine for server-side rendering

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation and README

---

**Built with ❤️ for Job Seekers**
