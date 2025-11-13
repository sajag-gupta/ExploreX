const passport = require('passport'); // Import passport module
const User = require('../models/user'); // Import the User model
const sanitizeHtml = require('sanitize-html');

// Sanitize user input to prevent XSS
const sanitizeInput = (input) => {
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {}
    });
};

module.exports.renderLoginForm = (req, res) => {
    res.render('users/login.ejs'); // Assuming 'login' is the name of your login form view file (login.ejs)
}

module.exports.verifyLogin = async (req, res) => {
    req.flash("success", 'Welcome to Wanderlust! You are logged in.');
    const redirectUrl = res.locals.redirectUrl || '/listings'; // Default to home page if redirectUrl is not set
    console.log(redirectUrl);
    res.redirect(redirectUrl); // Use the correct redirectUrl
}

module.exports.renderSignupForm = (req, res) => {
    res.render('users/signup.ejs'); // Assuming 'signup' is the name of your signup form view file (signup.ejs)
}

module.exports.createNewUser = async (req, res, next) => {
    try {
        // Sanitize user inputs
        const username = sanitizeInput(req.body.username);
        const email = sanitizeInput(req.body.email);
        const password = req.body.password; // Don't sanitize password, it will be hashed
        
        const user = new User({ username, email }); // Create a new user instance
        const registeredUser = await User.register(user, password); // Register the user with passport-local-mongoose

        // Authenticate user after successful signup
        passport.authenticate("local")(req, res, () => {
            // Flash success message
            req.flash('success', 'Welcome to Wanderlust! You are now registered and logged in.');
            // Redirect to the home page or any other desired page
            res.redirect('/listings');
        });

    } catch (err) {
        // Flash error message
        req.flash('error', err.message);
        res.redirect('/signup'); // Redirect back to signup page
    }
}

module.exports.logoutRequest = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err); // Pass any error to the next middleware
        }
        req.flash("success", "You are logged out!"); // Flash success message
        res.redirect('/listings'); // Redirect to the home page
    });
}
