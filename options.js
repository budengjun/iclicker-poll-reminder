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

const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = 880; // A5
    gain.gain.value = 0.1;

    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 500); // 0.5s beep
  } catch (e) {
    console.error('iClicker Monitor: Audio error', e);
  }
};

const testNotification = () => {
  chrome.runtime.sendMessage({ action: 'TEST_NOTIFY' });
  if (document.getElementById('enable-beep').checked) {
    playBeep();
  }
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('test-btn').addEventListener('click', testNotification);
