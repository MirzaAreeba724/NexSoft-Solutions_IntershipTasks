const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BlogUser = require('../models/BlogUser');
const BlogPost = require('../models/BlogPost');
const blogAuth = require('../middleware/blogAuth');

const JWT_SECRET = 'blog_website_super_secret_key_987';

// Global Middleware inside the Blog router to pass login state to all templates
router.use((req, res, next) => {
    const token = req.cookies.blogToken;
    if (token) {
        try {
            const verified = jwt.verify(token, JWT_SECRET);
            res.locals.is_logged_in = true;
            res.locals.currentUser = verified;
            req.blogUser = verified;
        } catch (err) {
            res.clearCookie('blogToken');
            res.locals.is_logged_in = false;
        }
    } else {
        res.locals.is_logged_in = false;
    }
    next();
});

// GET: Display All Blog Posts
router.get('/', async (req, res) => {
    try {
        const posts = await BlogPost.find().sort({ date: -1 });
        res.render('blog-list', { title: 'Tech Blog Hub', posts });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// GET: Render Login / Registration Page
router.get('/login', (req, res) => {
    if (req.query.redirectTo) {
        res.cookie('blogRedirectTo', req.query.redirectTo, { maxAge: 300000, httpOnly: true });
    } else {
        res.clearCookie('blogRedirectTo');
    }
    res.render('blog-auth', { title: 'Blog - Login or Register' });
});

// POST: Handle Registration
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userExists = await BlogUser.findOne({ email });
        if (userExists) {
            return res.render('blog-auth', { title: 'Blog - Login or Register', registerError: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new BlogUser({ username, email, password: hashedPassword });
        await newUser.save();

        res.render('blog-auth', { title: 'Blog - Login or Register', success: 'Registration successful! Please login below.' });
    } catch (err) {
        res.render('blog-auth', { title: 'Blog - Login or Register', registerError: 'Error creating account.' });
    }
});

// POST: Handle Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await BlogUser.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render('blog-auth', { title: 'Blog - Login or Register', loginError: 'Invalid email or password.' });
        }

        const token = jwt.sign({ id: user._id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
        res.cookie('blogToken', token, { httpOnly: true });

        const redirectTo = req.cookies.blogRedirectTo || '/blog';
        res.clearCookie('blogRedirectTo');
        res.redirect(redirectTo);
    } catch (err) {
        res.render('blog-auth', { title: 'Blog - Login or Register', loginError: 'Server error during login.' });
    }
});

// GET: Logout
router.get('/logout', (req, res) => {
    res.clearCookie('blogToken');
    res.clearCookie('blogRedirectTo');
    res.redirect('/blog');
});

// GET: Render Editor for New Post (Protected)
router.get('/new', blogAuth, (req, res) => {
    res.render('blog-editor', { title: 'Create New Post', isEdit: false });
});

// POST: Create New Post (Protected)
router.post('/new', blogAuth, async (req, res) => {
    try {
        const { title, content } = req.body;
        const newPost = new BlogPost({
            title,
            content,
            author: req.blogUser.id,
            authorName: req.blogUser.username
        });
        await newPost.save();
        res.redirect('/blog');
    } catch (err) {
        res.render('blog-editor', { title: 'Create New Post', isEdit: false, error: 'Failed to create post.' });
    }
});

// GET: View Single Blog Post
router.get('/post/:id', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).send('Post not found');
        res.render('blog-detail', { title: post.title, post });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// GET: Render Editor for Editing (Protected & Restricted to Author)
router.get('/edit/:id', blogAuth, async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).send('Post not found');
        if (post.author.toString() !== req.blogUser.id) {
            return res.status(403).send('Unauthorized action');
        }
        res.render('blog-editor', { title: 'Edit Post', isEdit: true, post });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// POST: Update Post (Protected & Restricted to Author)
router.post('/edit/:id', blogAuth, async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).send('Post not found');
        if (post.author.toString() !== req.blogUser.id) {
            return res.status(403).send('Unauthorized action');
        }

        post.title = req.body.title;
        post.content = req.body.content;
        await post.save();

        res.redirect(`/blog/post/${post._id}`);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// POST: Delete Post (Protected & Restricted to Author)
router.post('/delete/:id', blogAuth, async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).send('Post not found');
        if (post.author.toString() !== req.blogUser.id) {
            return res.status(403).send('Unauthorized action');
        }

        await BlogPost.findByIdAndDelete(req.params.id);
        res.redirect('/blog');
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;