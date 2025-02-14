const mongoose = require('mongoose');

const encodedUrl = new mongoose.Schema({
    longUrl: {
        type: String,
        required: true,
    },
    shortUrl: {
        type: String,
        required: true,
    },
    formatedDate: {
        type: String,
        required: true,
        default: (new Date()).toString(),
    },
    timestamp: {
        type: Date,
        required: true,
        default: new Date(),
    },
    IpAdress: {
        type: String,
        required: false,
    },
    visits: {
        type: Number,
        required: true,
        default: 0,
    }
});

module.exports = mongoose.model('encodedUrl', encodedUrl);