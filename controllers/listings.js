const Listing = require('../models/listing');
const Review = require('../models/review');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { cloudinary } = require('../cloudConfig');
const sanitizeHtml = require('sanitize-html');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Sanitize text input to prevent XSS
const sanitizeInput = (input) => {
    if (!input) return input;
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {}
    });
};

module.exports.showallListings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // 12 listings per page
        const skip = (page - 1) * limit;

        const totalListings = await Listing.countDocuments();
        const allListings = await Listing.find({})
            .skip(skip)
            .limit(limit)
            .populate('owner');

        const totalPages = Math.ceil(totalListings / limit);

        res.render('listings/index', { 
            allListings, 
            currentPage: page,
            totalPages: totalPages,
            totalListings: totalListings
        });
    } catch (error) {
        console.error('Error fetching listings:', error);
        // Render with empty data if error occurs
        res.render('listings/index', { 
            allListings: [], 
            currentPage: 1,
            totalPages: 1,
            totalListings: 0
        });
    }
}

module.exports.renderNewForm = (req, res) => {
    res.render('listings/new');
}

module.exports.createListing = async (req, res) => {
    try {
        // Sanitize inputs
        const title = sanitizeInput(req.body.title);
        const description = sanitizeInput(req.body.description);
        const price = req.body.price;
        const location = sanitizeInput(req.body.location);
        const country = sanitizeInput(req.body.country);
        const { path, filename } = req.file;
        
        // Send request to Mapbox Geocoding API
        const response = await geocodingClient.forwardGeocode({
            query: `${location}, ${country}`,
            limit: 1
        }).send();

        // Extract coordinates from the geocoding response
        const coordinates = response.body.features[0].geometry.coordinates;

        // Create new listing with geocoding data
        const newListing = new Listing({ 
            title, 
            description, 
            price, 
            location, 
            country, 
            geometry: { 
                type: "Point", 
                coordinates 
            },
            image: { url: path, filename }, 
            owner: req.user._id 
        });

        // Save the new listing
        await newListing.save();
        
        req.flash('success', 'New Listing Created');
        res.redirect('/listings');
    } catch (error) {
        console.error('Error creating listing:', error);
        req.flash('error', 'Failed to create listing');
        res.redirect('/listings');
    }
}


module.exports.showspecificListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id).populate({
            path: 'reviews',
            populate: {
                path: 'author' // Assuming 'author' is the field that references the User model in your Review schema
            }
        }).populate('owner');

        if (!listing) {
            req.flash('error', 'Listing does not exist');
            return res.redirect('/listings');
        }

        res.render('listings/show', { listing });
    } catch (error) {
        console.error('Error fetching listing:', error);
        req.flash('error', 'Failed to fetch listing details');
        res.redirect('/listings');
    }
}


module.exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        res.render('listings/edit', { listing });
    } catch (error) {
        console.error('Error rendering edit form:', error);
        req.flash('error', 'Failed to render edit form');
        res.redirect('/listings');
    }
}

module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Sanitize inputs
        const title = sanitizeInput(req.body.title);
        const description = sanitizeInput(req.body.description);
        const price = req.body.price;
        const location = sanitizeInput(req.body.location);
        const country = sanitizeInput(req.body.country);

        // Find the existing listing
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/listings');
        }

        // Send request to Mapbox Geocoding API
        const response = await geocodingClient.forwardGeocode({
            query: `${location}, ${country}`,
            limit: 1
        }).send();

        // Extract coordinates from the geocoding response
        const coordinates = response.body.features[0].geometry.coordinates;

        // Update basic fields
        listing.title = title;
        listing.description = description;
        listing.price = price;
        listing.location = location;
        listing.country = country;
        listing.geometry = {
            type: "Point",
            coordinates
        };

        // Handle image update if new image is uploaded
        if (req.file) {
            // Delete old image from Cloudinary if it exists
            if (listing.image && listing.image.filename) {
                await cloudinary.uploader.destroy(listing.image.filename);
            }
            
            // Update with new image
            listing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        await listing.save();
        
        req.flash('success', 'Listing Updated');
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error('Error updating listing:', error);
        req.flash('error', 'Failed to update listing');
        res.redirect('/listings');
    }
}


module.exports.deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        
        if (!listing) {
            req.flash('error', 'Listing does not exist');
            return res.redirect('/listings');
        }

        // Delete image from Cloudinary if it exists
        if (listing.image && listing.image.filename) {
            await cloudinary.uploader.destroy(listing.image.filename);
        }

        // Delete all reviews associated with this listing
        await Review.deleteMany({ _id: { $in: listing.reviews } });
        
        // Delete the listing
        await Listing.findByIdAndDelete(id);
        
        req.flash('success', 'Listing deleted successfully');
        res.redirect('/listings');
    } catch (error) {
        console.error('Error deleting listing:', error);
        req.flash('error', 'Failed to delete listing');
        res.redirect('/listings');
    }
}
