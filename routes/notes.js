const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth'); // Import auth middleware

// Use 'auth' middleware on all notes routes below
router.use(auth);

// 1. ADD NOTE: Show form
router.get('/add-note', (req, res) => {
    res.render('add-note', { title: 'Add New Note' });
});

// 2. ADD NOTE: Process submission
router.post('/add-note', async (req, res) => {
    try {
        const newNote = new Note({
            title: req.body.title,
            content: req.body.content,
            user: req.user.id // Assign note to logged-in user
        });
        await newNote.save();
        res.redirect('/notes');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving note");
    }
});

// 3. READ & SEARCH: Only list notes belonging to this user
router.get('/notes', async (req, res) => {
    console.log("🔍 DEBUG: Notes route has been reached!");
    try {
        const searchQuery = req.query.search;

        // Always filter by user: req.user.id
        let query = { user: req.user.id };

        if (searchQuery && searchQuery.trim() !== "") {
            query.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { content: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const notes = await Note.find(query).sort({ createdAt: -1 });
        res.render('notes', { notes: notes, searchQuery: searchQuery, username: req.user.username });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).send("Server Error");
    }
});

// 4. UPDATE: Show Edit Form (Verify owner)
router.get('/edit-note/:id', async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
        if (!note) return res.status(404).send("Note not found or unauthorized");
        res.render('edit-note', { note });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// 5. UPDATE: Save Edited Note
router.post('/edit-note/:id', async (req, res) => {
    try {
        await Note.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, {
            title: req.body.title,
            content: req.body.content
        });
        res.redirect('/notes');
    } catch (err) {
        res.status(500).send("Error updating note");
    }
});

// 6. DELETE: Remove a note
router.post('/delete-note/:id', async (req, res) => {
    try {
        await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.redirect('/notes');
    } catch (err) {
        res.status(500).send("Error deleting note");
    }
});

module.exports = router;