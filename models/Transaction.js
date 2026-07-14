const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Please add a positive or negative amount']
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);