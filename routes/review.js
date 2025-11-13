const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync'); // Corrected import statement
const { isLoggedIn, checkListingOwner, isReviewAuthor, validateReview } = require('../middleware'); 
const reviewController = require('../controllers/reviews.js');

// Route to handle submission of new review
router.post('/:id/reviews', isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// Route to handle deletion of a review
router.delete('/:listingId/reviews/:reviewId', isLoggedIn, isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;
