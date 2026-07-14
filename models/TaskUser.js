const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TaskUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' }
});

// Pre-save hook to hash user password (Mongoose 9 Async standard)
TaskUserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err; // Mongoose 9 automatically catches and forwards thrown errors in async hooks
    }
});

module.exports = mongoose.model('TaskUser', TaskUserSchema);