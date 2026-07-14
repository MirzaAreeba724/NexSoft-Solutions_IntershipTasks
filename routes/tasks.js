const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const TaskUser = require('../models/TaskUser');
const Task = require('../models/Task');

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.taskUser) {
        next();
    } else {
        res.redirect('/tasks/auth');
    }
};

// GET Login/Registration Form
router.get('/auth', (req, res) => {
    if (req.session && req.session.taskUser) {
        return res.redirect('/tasks');
    }
    res.render('tasks-auth', { title: 'Task Workspace Authentication' });
});

// POST Account Registration
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const existingEmail = await TaskUser.findOne({ email });
        const existingName = await TaskUser.findOne({ username });
        if (existingEmail || existingName) {
            return res.render('tasks-auth', {
                title: 'Authentication Error',
                error: 'An account with that email or username is already registered.'
            });
        }

        const newUser = new TaskUser({ username, email, password, role });
        await newUser.save();

        res.render('tasks-auth', {
            title: 'Registration Successful',
            success: 'Team account created successfully! Please login below.'
        });
    } catch (err) {
        console.error(err);
        res.render('tasks-auth', { title: 'Auth Error', error: 'Registration failed due to a system error.' });
    }
});

// POST Account Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await TaskUser.findOne({ email });
        if (!user) {
            return res.render('tasks-auth', { title: 'Login Failure', error: 'Invalid email address or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('tasks-auth', { title: 'Login Failure', error: 'Invalid email address or password.' });
        }

        req.session.taskUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        res.redirect('/tasks');
    } catch (err) {
        console.error(err);
        res.render('tasks-auth', { title: 'Login Failure', error: 'System connection error.' });
    }
});

// GET Logout
router.get('/logout', (req, res) => {
    req.session.taskUser = null;
    res.redirect('/tasks/auth');
});

// GET Protected Board View
router.get('/', requireAuth, async (req, res) => {
    try {
        const currentUser = req.session.taskUser;
        const teamUsers = await TaskUser.find({}, 'username role').sort({ username: 1 });

        let tasks = [];
        if (currentUser.role === 'admin' || currentUser.role === 'manager') {
            tasks = await Task.find({}).sort({ timestamp: -1 });
        } else {
            tasks = await Task.find({
                $or: [
                    { assignedTo: currentUser.username },
                    { createdBy: currentUser.username }
                ]
            }).sort({ timestamp: -1 });
        }

        res.render('tasks-dashboard', {
            title: 'Task Management System',
            currentUser,
            teamUsers,
            tasks
        });
    } catch (err) {
        console.error(err);
        res.send('Failure loading dashboard logs.');
    }
});

// POST Create Task
router.post('/create', requireAuth, async (req, res) => {
    const { title, description, priority, assignedTo, dueDate } = req.body;
    const currentUser = req.session.taskUser;

    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
        return res.status(403).send('Task creation restricted to managers/administrators.');
    }

    try {
        const newTask = new Task({
            title,
            description,
            priority,
            assignedTo,
            dueDate: dueDate ? new Date(dueDate) : null,
            createdBy: currentUser.username
        });

        await newTask.save();
        res.redirect('/tasks');
    } catch (err) {
        console.error(err);
        res.send('Failure creating task.');
    }
});

// POST Update Status / Priority
router.post('/update/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { status, priority } = req.body;
    try {
        await Task.findByIdAndUpdate(id, { status, priority });
        res.redirect('/tasks');
    } catch (err) {
        console.error(err);
        res.send('Failure updating status.');
    }
});

// GET Delete Task
router.get('/delete/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.taskUser;

    try {
        const task = await Task.findById(id);
        if (!task) return res.redirect('/tasks');

        if (currentUser.role === 'admin' || currentUser.role === 'manager' || task.assignedTo === currentUser.username) {
            await Task.findByIdAndDelete(id);
            res.redirect('/tasks');
        } else {
            res.status(403).send('Unauthorized deletion attempt.');
        }
    } catch (err) {
        console.error(err);
        res.send('Failure deleting task.');
    }
});

// POST Submit Comment
router.post('/comment/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const currentUser = req.session.taskUser;

    try {
        const task = await Task.findById(id);
        if (!task) return res.redirect('/tasks');

        task.comments.push({
            author: currentUser.username,
            text
        });

        await task.save();
        res.redirect('/tasks');
    } catch (err) {
        console.error(err);
        res.send('Failure posting comment.');
    }
});

module.exports = router;