const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    recipient: {
        type: String,
        default: null // Null indicates a public/group chat channel message
    },
    room: {
        type: String,
        default: 'General' // Used to differentiate group channels
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);