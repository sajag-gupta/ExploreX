if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const path = require('path');
const Listing = require('./models/listing.js');
const listingsRoutes = require('./routes/listing.js');
const reviewRoutes = require('./routes/review.js');
const userRoutes = require('./routes/user.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user.js');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const app = express();

// Security: Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Security: Helmet for setting security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.mapbox.com", "https://events.mapbox.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://api.mapbox.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://api.mapbox.com", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["blob:"],
            imgSrc: ["'self'", "blob:", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        },
    },
}));

// Security: Sanitize user input to prevent MongoDB injection
app.use(mongoSanitize({
    replaceWith: '_',
}));

// Middleware
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionOptions = {
    secret: process.env.SESSION_SECRET ,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        httpOnly: true,
    }
};

const dbUrl = process.env.ATLASDB_URL;

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret : process.env.SESSION_SECRET,
    },
    touchAfter: 24 * 3600,
});
store.on("error", err => {
    console.log("ERROR in mongo session store", err);
});

// Initialize Passport.js middleware
app.use(session({
    store,
    ...sessionOptions
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Passport.js configuration
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to set local variables for success and error flash messages
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user || null; // Ensure it's always defined
    next();
});

// MongoDB connection with SSL options
const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    tls: true,
    tlsAllowInvalidCertificates: true, // For development only
};

mongoose.connect(dbUrl, mongoOptions)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch(err => {
      console.error(`❌ Error connecting to MongoDB: ${err.message}`);
      console.log('⚠️  Starting server without database connection...');
      console.log('💡 Tip: Check your MongoDB Atlas IP whitelist and connection string');
  });

// Routes for listings
app.use('/listings', listingsRoutes);

// Routes for reviews
app.use('/listings', reviewRoutes);

// User routes (login, signup, logout)
app.use('/', userRoutes);

// Root route - redirect to listings
app.get('/', (req, res) => {
    res.redirect('/listings');
});

// 404 Handler - Must be after all other routes
app.all('*', (req, res, next) => {
    res.locals.currentUser = req.user || null; // Ensure currentUser is defined
    res.status(404).render('listings/error', { 
        status: 404, 
        message: 'Page Not Found' 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Internal Server Error' } = err;
    console.error('Error:', err.stack);
    
    res.locals.currentUser = req.user || null; // Ensure currentUser is defined
    
    // Send appropriate error response
    res.status(statusCode).render('listings/error', { 
        status: statusCode, 
        message: message 
    });
});

// Start the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
