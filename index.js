import express from 'express';
import { YoutubeTranscript } from 'youtube-transcript';
import { parse } from 'node-html-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

// Load the API key from the environment variables
const API_KEY = process.env.API_KEY;

app.use(express.json());

async function fetchVideoTitle(videoId) {
  try {
    const videoPage = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    ).then((res) => res.text());

    const html = parse(videoPage);
    const videoTitle = html.querySelector('title')?.text || 'Unknown title';

    if (videoTitle === 'Unknown title') {
      console.error('Unknown title for video:', videoId);
      return null;
    }

    return videoTitle;
  } catch (error) {
    console.error('Error fetching video title:', videoId, error);
    return null;
  }
}

async function getFullTranscript(videoId) {
  try {
    const [transcript, title] = await Promise.all([
      YoutubeTranscript.fetchTranscript(videoId),
      fetchVideoTitle(videoId),
    ]);

    const fullTranscript = transcript
      .map((segment) => segment.text)
      .join(' ');

    if (fullTranscript.trim() === '' || !title) {
      console.error('Transcript or title is empty:', videoId);
      return { transcript: null, title: null };
    }

    console.log('Youtube transcript and title fetched successfully:', videoId);
    return { transcript: fullTranscript, title };
  } catch (error) {
    console.error('Error fetching transcript or title:', videoId, error);
    return { transcript: null, title: null };
  }
}

app.post('/api/transcript', async (req, res) => {
  const { videoId, apiKey } = req.body;

  // Check if API key is provided and correct
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  const result = await getFullTranscript(videoId);

  if (result.transcript && result.title) {
    res.json(result);
  } else {
    res.status(500).json({ error: 'Failed to fetch transcript or title' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default getFullTranscript;
