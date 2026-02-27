// Saves options to chrome.storage
const saveOptions = () => {
  const selectorsText = document.getElementById('selectors').value;
  const enableBeep = document.getElementById('enable-beep').checked;

  // Split by newline and filter out empty strings
  const selectors = selectorsText.split('\n').map(s => s.trim()).filter(s => s);

  chrome.storage.sync.set(
    { selectors: selectors, enableBeep: enableBeep },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.style.opacity = '1';
      setTimeout(() => {
        status.style.opacity = '0';
      }, 2000);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(
    { selectors: [], enableBeep: true },
    (items) => {
      document.getElementById('selectors').value = items.selectors.join('\n');
      document.getElementById('enable-beep').checked = items.enableBeep;
    }
  );
};

const playNotificationChime = () => {
  try {
    const audio = new Audio(chrome.runtime.getURL('notification.wav'));
    audio.volume = 1.0;
    audio.play().catch(e => console.error('iClicker Monitor: Audio play error', e));
  } catch (e) {
    console.error('iClicker Monitor: Audio error', e);
  }
};

const testNotification = () => {
  chrome.runtime.sendMessage({ action: 'TEST_NOTIFY' });
  if (document.getElementById('enable-beep').checked) {
    playNotificationChime();
  }
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('test-btn').addEventListener('click', testNotification);
