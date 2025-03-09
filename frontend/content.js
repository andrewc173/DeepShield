// Function to extract video URLs
function getVideoURLs() {
  const videoElements = document.querySelectorAll('video');
  let videoURLs = [];

  videoElements.forEach((video) => {
    // Check for <source> tags within the video element
    const sourceElement = video.querySelector('source');
    if (sourceElement && sourceElement.src) {
      videoURLs.push(sourceElement.src);
    } 
    // Fallback to video src attribute if available and not a blob
    else if (video.src && !video.src.startsWith('blob:')) {
      videoURLs.push(video.src);
    } 
    // Fallback to currentSrc if not a blob
    else if (video.currentSrc && !video.currentSrc.startsWith('blob:')) {
      videoURLs.push(video.currentSrc);
    }
  });

  // Filter out empty or invalid URLs
  videoURLs = videoURLs.filter((url) => url && !url.startsWith('blob:'));

  // If no valid video URLs are found, fallback to the page URL
  return videoURLs.length > 0 ? videoURLs : [window.location.href];
}

// Initial highlighting
const mediaElements = document.querySelectorAll('img, video');
mediaElements.forEach((el) => {
  el.style.border = '2px solid yellow'; // Scanning indicator
});

// Send video URLs to popup when requested
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getVideos') {
    const videoURLs = getVideoURLs();
    sendResponse({ videoURLs });
  } else {
    // Highlight based on detection results
    mediaElements.forEach((el) => {
      el.style.border = message.isDeepfake ? '3px solid red' : '3px solid green';
    });
  }
});