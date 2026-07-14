const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: 'https://placehold.co/300x200' },
    stock: { type: Number, required: true, min: 0, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);