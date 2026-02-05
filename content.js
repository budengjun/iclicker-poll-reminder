let settings = {
  selectors: [],
  enableBeep: true
};

let lastHash = '';
let debounceTimer = null;
const DEBOUNCE_DELAY = 1000; // Check max once per second to avoid spam

// Load settings
chrome.storage.sync.get({ selectors: [], enableBeep: true }, (items) => {
  settings = items;
  console.log('iClicker Monitor: Settings loaded', settings);
  startObserver();
});

// Update settings if they change
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.selectors) settings.selectors = changes.selectors.newValue;
    if (changes.enableBeep) settings.enableBeep = changes.enableBeep.newValue;
    console.log('iClicker Monitor: Settings updated', settings);
  }
});

function startObserver() {
  const observer = new MutationObserver((mutations) => {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      checkPage();
      debounceTimer = null;
    }, DEBOUNCE_DELAY);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['disabled', 'class', 'style'] // Watch for button enabling/disabling
  });
  
  // Initial check
  checkPage();
}

function checkPage() {
  let currentHash = '';
  let questionDetected = false;

  if (settings.selectors && settings.selectors.length > 0) {
    // Custom Selector Mode
    const parts = [];
    settings.selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        // If element exists, we consider it potential activity.
        // We include its text in the hash. 
        // If the element just appeared, text might be empty or specific.
        parts.push(el.innerText.trim());
      }
    });

    // If we found any content in the targeted selectors
    const content = parts.join('|');
    if (content.length > 0) {
      currentHash = content;
      // We assume detection if the content is "meaningful" (not empty)
      // Users might select a container that is always there but empty.
      if (currentHash.replace(/\|/g, '').length > 0) {
        questionDetected = true;
      }
    }
    
  } else {
    // Auto-Detection Mode
    const bodyText = document.body.innerText;
    
    // Heuristic 1: Keywords
    const keywords = ['Polling', 'Question 1', 'Question 2', 'Question 3', 'Question 4', 'Question 5', 'Seconds Remaining'];
    const keywordMatch = keywords.find(k => bodyText.includes(k));
    if (keywordMatch) {
      currentHash += `|KEY:${keywordMatch}`;
      questionDetected = true;
    }
    
    // Heuristic 2: Enabled Submit Button
    const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
    const activeSubmit = buttons.find(b => 
      !b.disabled && 
      (b.innerText.match(/Submit|Vote|Send/i) || b.value.match(/Submit|Vote|Send/i))
    );

    if (activeSubmit) {
      currentHash += `|BTN:${activeSubmit.innerText}`;
      questionDetected = true;
    }

    // Heuristic 3: Countdown
    // Look for text matching time patterns like "0:30", "1:00"
    // We check for presence but don't include the exact time in hash to avoid spamming every second.
    const timerMatch = bodyText.match(/\d{1,2}:\d{2}/);
    if (timerMatch) {
      currentHash += `|TIMER_PRESENT`;
      questionDetected = true;
    }
    
    // Scan for "Polling" status specifically (redundant with keywords but harmless)
    if (bodyText.match(/Polling|Poll Open/i)) {
      currentHash += "|STATUS:POLLING";
      questionDetected = true;
    }

    // Heuristic 4: "Question N" specific text
    const qMatch = bodyText.match(/Question \d+/i);
    if (qMatch) {
      currentHash += `|${qMatch[0]}`;
      questionDetected = true;
    }
  }

  // Decision Logic
  if (questionDetected && currentHash !== lastHash) {
    // Check if it's a "new" question state
    // If lastHash was non-empty and currentHash is different, it's a new state (e.g. Q1 -> Q2)
    // If lastHash was empty, it's definitely new.
    
    console.log('iClicker Monitor: Change detected.', { old: lastHash, new: currentHash });
    
    // We update lastHash immediately
    lastHash = currentHash;
    
    // Send Notification
    chrome.runtime.sendMessage({ action: 'NOTIFY' });
    
    // Play Sound if enabled
    if (settings.enableBeep) {
      playBeep();
    }
  } else if (!questionDetected) {
    // Reset hash if no question detected, so next one triggers
    lastHash = '';
  }
}

function playBeep() {
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
}
