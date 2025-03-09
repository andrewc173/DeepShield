import os
import json
import re
import google.generativeai as genai
from flask import Flask, request, jsonify

# Configure Gemini API
genai.configure(api_key="AIzaSyA9nocIcx5K2-THa6dljmRzx9FqdwnjqSU")  # Ensure this env variable is set

# Gemini model setup
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",  # Gemini returns text; we'll enforce JSON in prompt
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
)

# Updated prompt with strict JSON output requirement
chat_session = model.start_chat(
    history=[
        {
            "role": "user",
            "parts": [
                """You are an advanced AI model designed to analyze images and videos from given URLs to detect potential deepfakes. Your task is to evaluate the provided media using forensic techniques such as texture inconsistencies, unnatural facial movements, lighting mismatches, and other artifacts typical of AI-generated content. After analysis, provide your response in this exact JSON format:

{
  "isDeepfake": <boolean>,  // true if likely a deepfake, false if not
  "confidence": <decimal>,  // a number between 0 and 1 (e.g., 0.85), representing confidence in the assessment
  "reason": "<brief reason in quotes>"  // a concise explanation, max 100 characters
}

Perform the analysis by:
1. Examining facial features (blinking, eye movements, lip sync, muscle movements) for unnatural patterns.
2. Checking texture and lighting for inconsistencies (skin, hair, shadows).
3. Identifying warping or blending artifacts around edges.
4. Evaluating audio-visual sync if applicable.
5. Considering contextual clues if available.

If no URL is provided or the media can't be accessed, return:
{
  "isDeepfake": false,
  "confidence": 0.0,
  "reason": "No media provided or accessible"
}

Respond only with the JSON string, nothing else."""
            ],
        },
    ]
)

# Flask app setup
app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze_video():
    data = request.get_json()
    if not data or 'videoURLs' not in data or not data['videoURLs']:
        return jsonify({
            "isDeepfake": False,
            "confidence": 0.0,
            "reason": "No video URL provided"
        }), 400

    video_url = data['videoURLs'][0]  # Take the first URL
    print(f"Analyzing URL: {video_url}")

    # Send URL to Gemini
    try:
        response = chat_session.send_message(video_url)
        response_text = response.text.strip()  # Get the raw text response
        result = response_text
        print("response_text: ", response_text)
        print("result1:", result)
        print("type result1:", type(result))
        result = re.sub(r"```json|```", "", result).strip()
        #result='{ "id": 121, "name": "Naveen", "course": "MERN Stack"}'
        result = json.loads(result)  
        print("result2:", result)
        # Validate and format the response
        print("type:", type(result))

        return jsonify({
            "isDeepfake": bool(result["isDeepfake"]),
            "confidence": float(result["confidence"]),
            "reason": str(result["reason"])
        })
    except json.JSONDecodeError:
        # If Gemini doesn't return valid JSON, fallback to a default response
        return jsonify({
            "isDeepfake": False,
            "confidence": 0.0,
            "reason": "Invalid response from AI"
        }), 500
    except Exception as e:
        # Handle other errors (e.g., network issues, Gemini API failure)
        return jsonify({
            "isDeepfake": False,
            "confidence": 0.0,
            "reason": f"Analysis failed: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5555, debug=True)