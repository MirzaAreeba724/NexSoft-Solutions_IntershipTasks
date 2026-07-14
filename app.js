require('dotenv').config(); // Load environment variables safely
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session'); // Loaded after installation

// 1. Router Imports
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var moviesRouter = require('./routes/movies');
var adminRouter = require('./routes/admin');
var portfolioRouter = require('./routes/portfolio');
var contactRouter = require('./routes/contact');
var landingRouter = require('./routes/landing');
var todoRouter = require('./routes/todo');
var calculatorRouter = require('./routes/calculator');
var weatherRouter = require('./routes/weather');
var authRouter = require('./routes/auth');   // Notes Auth
var notesRouter = require('./routes/notes');
var expenseRouter = require('./routes/expense');
var blogRouter = require('./routes/blog');
var ecommerceRouter = require('./routes/ecommerce');
var chatRouter = require('./routes/chat');
var tasksRouter = require('./routes/tasks');

var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize secure express-session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'nexsoft-solutions-secure-secret-key-98765',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if deploying over HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true // Mitigates XSS security vulnerabilities
    }
}));

// ==========================================
// 2. ROUTE REGISTRATIONS
// ==========================================
app.use('/blog', blogRouter);
app.use('/expense', expenseRouter);
app.use('/users', usersRouter);
app.use('/movies', moviesRouter);
app.use('/admin', adminRouter);
app.use('/portfolio', portfolioRouter);
app.use('/contact', contactRouter);
app.use('/landing', landingRouter);
app.use('/todo', todoRouter);
app.use('/calculator', calculatorRouter);
app.use('/weather', weatherRouter);
app.use('/ecommerce', ecommerceRouter);
app.use('/chat', chatRouter);
app.use('/tasks', tasksRouter);

// Root routes at the bottom
app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', notesRouter);

console.log("🔥 SERVER INITIALIZED WITH ALL ROUTES AND SECURED SESSIONS!");

// Database connection
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('✅ Successfully connected to MongoDB Atlas!');
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:');
        console.error('   Message:', err.message);
        console.error('   Code:', err.code);
        process.exit(1);
    });

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

// Add this at the end of app.js (before module.exports = app)
console.log("=== REGISTERED ROUTES ===");
app._router.stack.forEach(function (r) {
    if (r.route && r.route.path) {
        console.log("Route:", r.route.path);
    } else if (r.handle && r.handle.stack) {
        r.handle.stack.forEach(function (s) {
            if (s.route) {
                console.log("Mounted Route:", s.route.path);
            }
        });
    }
});
console.log("=========================");

module.exports = app;