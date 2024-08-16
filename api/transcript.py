import os
from youtube_transcript_api import YouTubeTranscriptApi
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the API key and FlareSolverr URL from environment variables
API_KEY = os.getenv("API_KEY")
FLARESOLVERR_URL = os.getenv("FLARESOLVERR_URL")

def fetch_youtube_transcript(video_id):
    """Fetches the transcript of a YouTube video using FlareSolverr as a proxy."""
    try:
        proxies = {"https": FLARESOLVERR_URL} if FLARESOLVERR_URL else None
        transcript = YouTubeTranscriptApi.get_transcript(video_id, proxies=proxies)
        return transcript
    except Exception as e:
        return str(e)

def clean_transcript(transcript):
    """Removes start time and duration from the transcript and returns only the text."""
    cleaned_text = ""
    for entry in transcript:
        cleaned_text += entry['text'] + " "
    return cleaned_text.strip()

@app.route('/api/transcript', methods=['POST'])
def get_transcript():
    """HTTP endpoint to get the cleaned YouTube transcript."""
    data = request.get_json()
    
    # Check if apiKey is provided and correct
    api_key = data.get('apiKey')
    if not api_key or api_key != API_KEY:
        return jsonify({'error': 'Unauthorized access'}), 401
    
    video_id = data.get('video_id')
    
    if not video_id:
        return jsonify({'error': 'Video ID is required'}), 400
    
    transcript = fetch_youtube_transcript(video_id)
    
    if isinstance(transcript, str):
        return jsonify({'error': transcript}), 500
    
    cleaned_text = clean_transcript(transcript)
    return jsonify({'transcript': cleaned_text})

if __name__ == "__main__":
    app.run()
