const express = require('express');
const router = express.Router();
const passport = require('passport'); // Import passport module
const { savedRedirectUrl, validateUserSignup, validateUserLogin } = require('../middleware');
const userController = require('../controllers/users.js');

// Route to handle user login
router.route('/login')
    .get(userController.renderLoginForm)
    .post(validateUserLogin, savedRedirectUrl, passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }), userController.verifyLogin);

// Route to render the signup form and handle user signup
router.route('/signup')
    .get(userController.renderSignupForm)
    .post(validateUserSignup, userController.createNewUser);

// Route to handle user logout
router.get('/logout', userController.logoutRequest);

module.exports = router;
