document.getElementById('settings-btn').addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

// Set up the manual audio test player
const audioTest = document.getElementById('audio-test');
audioTest.src = chrome.runtime.getURL('notification.wav');

document.getElementById('test-btn').addEventListener('click', () => {
  // Send to background for notification + offscreen audio
  chrome.runtime.sendMessage({ action: 'TEST_NOTIFY' });
  
  // Also try playing directly from popup (user gesture context)
  const audio = new Audio(chrome.runtime.getURL('notification.wav'));
  audio.volume = 1.0;
  audio.play()
    .then(() => console.log('Popup: audio playing'))
    .catch(e => console.error('Popup: audio error:', e.name, e.message));
});
