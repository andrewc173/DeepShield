document.getElementById('scanBtn').addEventListener('click', () => {
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  const status = document.getElementById('status');
  const confidenceBar = document.getElementById('confidence');
  const details = document.getElementById('details');
  const urlText = document.getElementById('urlText');

  // Show loading state
  loadingDiv.classList.remove('hidden');
  resultsDiv.classList.add('hidden');

  // Get active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;

    // Inject content script and get video URLs
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }, () => {
      chrome.tabs.sendMessage(tabId, { action: 'getVideos' }, (response) => {
        const videoURLs = response?.videoURLs || [tabs[0].url]; // Fallback to page URL
        console.log('Extracted Video URLs:', videoURLs); // Debug in console

        const analyzedURL = videoURLs[0];
        console.log('Analyzing Video URL:', analyzedURL); // Debug in console

        // Send the video URLs to the backend for analysis
        fetch("http://localhost:5555/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ videoURLs })
        })
        .then((resp) => resp.json())
        .then((result) => {
          // Update UI with results received from backend
          loadingDiv.classList.add('hidden');
          resultsDiv.classList.remove('hidden');
          status.textContent = result.isDeepfake ? 'Deepfake Detected!' : 'Likely Authentic';
          // Convert the confidence (decimal) to a percentage for display
          let confidencePercent = Math.round(result.confidence * 100);
          confidenceBar.style.width = `${confidencePercent}%`;
          confidenceBar.classList.remove('bg-red-500', 'bg-green-500');
          confidenceBar.classList.add(result.isDeepfake ? 'bg-red-500' : 'bg-green-500');
          details.textContent = `Reason: ${result.reason}`;
          urlText.textContent = analyzedURL; // Display the extracted URL

          // Send result to content script for highlighting media elements
          chrome.tabs.sendMessage(tabId, result);
        })
        .catch((error) => {
          console.error("Error during analysis:", error);
          loadingDiv.classList.add('hidden');
          resultsDiv.classList.remove('hidden');
          status.textContent = 'Error';
          details.textContent = 'Failed to analyze media.';
        });
      });
    });
  });
});

// Dark/Light mode toggle
document.getElementById('toggleMode').addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  document.getElementById('toggleMode').textContent =
    document.body.classList.contains('light-mode') ? 'Toggle Dark Mode' : 'Toggle Light Mode';
});
