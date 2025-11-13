const express = require('express');
const router = express.Router();
const { isLoggedIn, checkListingOwner, validateListing } = require('../middleware.js');
const listingController = require('../controllers/listings.js');
const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });
const wrapAsync = require('../utils/wrapAsync'); // Corrected import statement

// Route to display all listings
router.route('/')
    .get(wrapAsync(listingController.showallListings));

// Route to render form for creating a new listing
router.route('/new')
    .get(isLoggedIn, listingController.renderNewForm)
    .post(isLoggedIn, upload.single('image'), validateListing, wrapAsync(listingController.createListing));

// Route to display details of a specific listing
router.route('/:id')
    .get(wrapAsync(listingController.showspecificListing));

// Route to render form for editing a listing and handle updating or editing of existing listing form
router.route('/:id/edit')
    .get(isLoggedIn, checkListingOwner, wrapAsync(listingController.renderEditForm))
    .put(isLoggedIn, checkListingOwner, upload.single('image'), validateListing, wrapAsync(listingController.updateListing));

// Route to handle deletion of a listing
router.delete('/:id/delete', isLoggedIn, checkListingOwner, wrapAsync(listingController.deleteListing));

module.exports = router;
