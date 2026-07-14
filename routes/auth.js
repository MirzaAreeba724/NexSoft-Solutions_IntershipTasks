const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'your_super_secret_notes_key_123';

// 1. GET Registration Form
router.get('/register', (req, res) => {
    res.render('register', { title: 'Create Account' });
});

// 2. POST Registration Form
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.render('register', { title: 'Create Account', error: 'Email already registered.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        res.render('register', { title: 'Create Account', error: 'Error creating account.' });
    }
});

// 3. GET Login Form
router.get('/login', (req, res) => {
    // If there is a redirect query, temporarily save it in a cookie (valid for 5 minutes)
    if (req.query.redirectTo) {
        res.cookie('redirectTo', req.query.redirectTo, { maxAge: 300000, httpOnly: true });
    } else {
        // Clear any leftover redirect cookies if they visit /login directly
        res.clearCookie('redirectTo');
    }
    res.render('login', { title: 'Login' });
});

// 4. POST Login Form
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render('login', { title: 'Login', error: 'Invalid email or password.' });
        }

        // Create JWT token
        const token = jwt.sign({ id: user._id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        // Save token in cookie
        res.cookie('token', token, { httpOnly: true });

        // Check if a dynamic redirect path was stored in the cookie, otherwise default to '/notes'
        const redirectTo = req.cookies.redirectTo || '/notes';

        // Clear the redirect cookie immediately after reading it
        res.clearCookie('redirectTo');

        res.redirect(redirectTo);
    } catch (err) {
        res.render('login', { title: 'Login', error: 'Server error.' });
    }
});

// 5. GET Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('redirectTo');
    res.redirect('/login');
});

module.exports = router;