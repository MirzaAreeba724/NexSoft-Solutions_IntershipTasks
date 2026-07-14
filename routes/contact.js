var express = require('express');
var router = express.Router();

// Contact form handler - just logs messages, no email needed
router.post('/send-message', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validate inputs
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Log the message to server console
        console.log("📧 NEW CONTACT MESSAGE:");
        console.log("   👤 Name:", name);
        console.log("   📧 Email:", email);
        console.log("   💬 Message:", message);
        console.log("   ⏰ Time:", new Date().toLocaleString());
        console.log("-----------------------------------");

        // Return success response
        res.json({
            success: true,
            message: 'Message received! Thank you for contacting me.'
        });

    } catch (err) {
        console.error("❌ Error processing contact form:", err);
        res.status(500).json({
            success: false,
            message: 'Error sending message. Please try again.'
        });
    }
});

module.exports = router;
