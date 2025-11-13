const Listing = require('../models/listing');
const Review = require('../models/review');
const { ExpressError } = require('../utils/expressError');
const sanitizeHtml = require('sanitize-html');

// Sanitize text input to prevent XSS
const sanitizeInput = (input) => {
    if (!input) return input;
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {}
    });
};

module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const comment = sanitizeInput(req.body.review.comment);
    const rating = req.body.review.rating;

    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError('Listing not found', 404);

    let newReview = new Review({ comment, rating });
    newReview.author = req.user._id; // Assigns the user who is making this review as the author
    listing.reviews.push(newReview);

    await Promise.all([newReview.save(), listing.save()]);
    
    req.flash("success", "Review added successfully");
    res.redirect(`/listings/${id}`);
}

module.exports.deleteReview = async (req, res) => {
    const { listingId, reviewId } = req.params;
    
    // Remove review reference from listing
    await Listing.findByIdAndUpdate(listingId, { $pull: { reviews: reviewId } });
    
    // Delete the review itself
    await Review.findByIdAndDelete(reviewId);
    
    req.flash("success", "Review deleted successfully");
    res.redirect(`/listings/${listingId}`);
}