// Background service worker: handles notifications and audio

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const iconUrl = chrome.runtime.getURL('icon.png');

  if (request.action === 'NOTIFY') {
    chrome.notifications.create('iclicker-question-' + Date.now(), {
      type: 'basic',
      iconUrl: iconUrl,
      title: 'New iClicker Question!',
      message: 'A new question or poll has been detected.',
      priority: 2,
      requireInteraction: true
    });
  } else if (request.action === 'TEST_NOTIFY') {
    chrome.notifications.create('iclicker-test-' + Date.now(), {
      type: 'basic',
      iconUrl: iconUrl,
      title: 'Test Notification',
      message: 'This is a test notification from iClicker Monitor.',
      priority: 2
    });
  }

  // Play sound for any notification action
  if (request.action === 'NOTIFY' || request.action === 'TEST_NOTIFY') {
    chrome.storage.sync.get({ enableBeep: true }, (items) => {
      if (items.enableBeep) {
        playSound();
      }
    });
  }
});

async function playSound() {
  // Close any existing offscreen document first
  try {
    await chrome.offscreen.closeDocument();
  } catch (e) {
    // No existing document, that's fine
  }

  // Create new offscreen document — it plays the sound on load
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Playing notification chime sound'
    });
    console.log('Offscreen document created for audio playback');
  } catch (e) {
    console.warn('Failed to create offscreen document:', e);
  }
}
