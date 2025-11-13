const Joi = require('joi');

// Listing Validation Schema
module.exports.listingSchema = Joi.object({
    title: Joi.string().required().min(3).max(100).trim(),
    description: Joi.string().required().min(10).max(2000).trim(),
    price: Joi.number().required().min(0).max(1000000),
    location: Joi.string().required().min(2).max(100).trim(),
    country: Joi.string().required().min(2).max(100).trim(),
    image: Joi.string().allow("", null)
});

// Review Validation Schema
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        comment: Joi.string().required().min(3).max(500).trim(),
        rating: Joi.number().required().min(1).max(5)
    }).required()
});

// User Signup Validation Schema
module.exports.userSignupSchema = Joi.object({
    username: Joi.string().required().alphanum().min(3).max(30).trim(),
    email: Joi.string().required().email().trim().lowercase(),
    password: Joi.string().required().min(6).max(50)
});

// User Login Validation Schema
module.exports.userLoginSchema = Joi.object({
    username: Joi.string().required().alphanum().min(3).max(30).trim(),
    password: Joi.string().required()
});
