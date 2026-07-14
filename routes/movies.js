var express = require('express');
var router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    try {
        const searchQuery = req.query.search;
        const page = parseInt(req.query.page) || 1;
        let movies = [];
        let totalResults = 0;
        let errorMessage = '';

        if (searchQuery && searchQuery.trim() !== '') {
            const apiKey = '8c87545d';
            const url = `https://www.omdbapi.com/?s=${encodeURIComponent(searchQuery)}&page=${page}&apikey=${apiKey}`;

            console.log("🔍 Requesting OMDb API with URL:", url);

            try {
                const response = await axios.get(url, {
                    timeout: 8000 // 8 second timeout
                });

                console.log("📡 API Response Status:", response.status);
                console.log("📡 API Response Data:", response.data);

                if (response.data.Response === 'True') {
                    movies = response.data.Search || [];
                    totalResults = parseInt(response.data.totalResults) || 0;
                    console.log(`✅ Found ${movies.length} movies`);
                } else if (response.data.Response === 'False') {
                    errorMessage = response.data.Error || 'No movies found';
                    console.log("⚠️ API Error:", errorMessage);
                } else {
                    errorMessage = 'Unexpected API response format';
                    console.log("❌ Unexpected response:", response.data);
                }
            } catch (apiErr) {
                console.error("❌ OMDb API Error Details:");
                console.error("   Status:", apiErr.response?.status);
                console.error("   Status Text:", apiErr.response?.statusText);
                console.error("   Data:", apiErr.response?.data);
                console.error("   Message:", apiErr.message);
                console.error("   Code:", apiErr.code);

                // Specific error messages
                if (apiErr.code === 'ECONNABORTED') {
                    errorMessage = 'Request timed out. OMDb API is slow.';
                } else if (apiErr.response?.status === 401) {
                    errorMessage = 'API Key is invalid or expired.';
                } else if (apiErr.response?.status === 403) {
                    errorMessage = 'Access denied. Daily request limit may be exceeded.';
                } else if (apiErr.code === 'ENOTFOUND') {
                    errorMessage = 'Cannot connect to OMDb API. Check internet connection.';
                } else {
                    errorMessage = `API Error: ${apiErr.message}`;
                }
            }
        }

        res.render('movies', {
            movies: movies,
            searchQuery: searchQuery,
            currentPage: page,
            totalResults: totalResults,
            totalPages: totalResults > 0 ? Math.ceil(totalResults / 10) : 0,
            errorMessage: errorMessage
        });
    } catch (err) {
        console.error("💥 Server Error:", err);
        res.status(500).render('error', { message: 'Server error occurred' });
    }
});

module.exports = router;
