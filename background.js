const ICON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAFVJREFUaEPt2LMRA0AIBcFDwOtfCGuQz4fP3C082E11x81MH6/5W+s+59zX/g48ePDgwYMHDB48ePDgwYMHDB48ePDgwYMHDB48ePDgwYMH/4E337i9ATyG3CJ1qWqDAAAAAElFTkSuQmCC'; // Simple blue square

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'NOTIFY') {
    chrome.notifications.create('iclicker-question-' + Date.now(), {
      type: 'basic',
      iconUrl: ICON_URL,
      title: 'New iClicker Question!',
      message: 'A new question or poll has been detected.',
      priority: 2,
      requireInteraction: true
    });
  } else if (request.action === 'TEST_NOTIFY') {
    chrome.notifications.create('iclicker-test-' + Date.now(), {
      type: 'basic',
      iconUrl: ICON_URL,
      title: 'Test Notification',
      message: 'This is a test notification from iClicker Monitor.',
      priority: 2
    });
  }
});
