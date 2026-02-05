document.getElementById('settings-btn').addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

document.getElementById('test-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'TEST_NOTIFY' });
});
