require('dotenv').config();
const mongoose = require('mongoose');

// Define the schema for the Certificate table
const certSchema = new mongoose.Schema({
    name: String,
    email: String,
    fingerprint: String,
    authority: String,
    certificateType: String,
    College: String,
    Phone: String,
    event: String,
    comment: String,
    uuid: String,
    hash: String,
    issuer: { type: mongoose.Schema.Types.ObjectId, ref: 'Issuer' } 
});


// Create a model from the schema
const Cert = mongoose.model('Cert', certSchema);

// Connect to MongoDB
mongoose.connect(process.env.DBURL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

module.exports = Cert;