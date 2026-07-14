const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    author: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    dueDate: { type: Date },
    assignedTo: { type: String, default: 'Unassigned' }, // Username of the assignee
    createdBy: { type: String, required: true }, // Username of the creator
    comments: [CommentSchema],
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);