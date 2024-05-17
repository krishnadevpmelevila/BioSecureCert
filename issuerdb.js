require('dotenv').config();
const mongoose = require('mongoose');


// Schma for the issuer table
const issuerSchema = new mongoose.Schema({
    username: String,
    password: String,
    // Add any other fields related to the issuer
});


// Create a model from the schema
const Issuer = mongoose.model('Issuer', issuerSchema);
// Connect to MongoDB
mongoose.connect(process.env.DBURL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

module.exports = Issuer;