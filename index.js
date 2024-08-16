const express = require('express');
const { getTranscript } = require('youtube-transcript');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Load the API key from the environment variables
const API_KEY = process.env.API_KEY;

app.post('/api/transcript', async (req, res) => {
    const { videoId, apiKey } = req.body;

    // Check if API key is provided and correct
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
    }

    try {
        const transcript = await getTranscript(videoId);

        // Clean transcript: remove start and duration times, keep only text
        const cleanedTranscript = transcript.map(item => item.text).join(' ');

        res.json({ transcript: cleanedTranscript });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
