const mongoose = require('mongoose');
const data = require('./data.js');
const Listing = require('../models/listing.js');
const mongoUrl = "mongodb://127.0.0.1:27017/wanderlust";

const main = async () => {
    try {
        await mongoose.connect(mongoUrl);
        console.log("Connected to MongoDB!");
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error}`);
    }
};

main();

const initDb = async () => {
    try {
        await Listing.deleteMany({});
        const ownerId = "661d3fde6a34be3e9467f44c"; // Assuming this is the ID of the owner
        const listingsWithOwner = data.map(listing => ({ ...listing, owner: ownerId }));
        await Listing.insertMany(listingsWithOwner);
        console.log("Saved all listings to the database.");
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

initDb();
