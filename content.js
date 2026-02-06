let settings = {
  selectors: [],
  enableBeep: true
};

// State management
let lastState = {
  answerText: '',
  imgSrc: '',
  hash: '' // for fallback/auto-mode compatibility
};

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
    attributeFilter: ['disabled', 'class', 'style', 'src'] // Added 'src' for image tracking
  });
  
  // Initial check
  checkPage();
}

function checkPage() {
  const bodyText = document.body.innerText;

  // Global Guard: If "Polling Closed" is present, do not notify.
  // We use a case-insensitive check.
  if (/Polling\s+Closed/i.test(bodyText)) {
    // We can reset state here if we want to ensure next start is detected,
    // or just let the "Empty" state updates handle it naturally.
    // However, keeping the current state allows us to detect when it OPENS again.
    // If we simply return, we might miss the transition if the state doesn't "change" further.
    // Better strategy: We still process the state to keep 'lastState' in sync, but we suppress notification.
  }

  const isPollingClosed = /Polling\s+Closed/i.test(bodyText);
  let shouldNotify = false;

  // --- Specific Selector Logic ---

  // 1. Answer Container Logic
  // We look for .question-answer-container (standard iClicker class)
  const answerContainer = document.querySelector('.question-answer-container');
  const currentAnswerText = answerContainer ? answerContainer.innerText.trim() : '';

  // Rule: Only notify if transitioning from Empty -> Non-Empty
  if (lastState.answerText === '' && currentAnswerText !== '') {
    if (!/answer received/i.test(currentAnswerText)) {
      shouldNotify = true;
    }
  }

  // Update state
  lastState.answerText = currentAnswerText;


  // 2. Image Logic
  // We look for .question-image-container img.img-border (standard iClicker class)
  const imgElement = document.querySelector('.question-image-container img.img-border');
  // Check both src and currentSrc (standard prop), fallback to empty string
  const currentImgSrc = imgElement ? (imgElement.currentSrc || imgElement.src) : '';

  // Rule: Notify if src changes to a new, non-empty value
  // Note: If lastState.imgSrc was empty, and now we have one, that's a change.
  // If lastState.imgSrc was 'A', and now 'B', that's a change.
  if (currentImgSrc && currentImgSrc !== lastState.imgSrc) {
    shouldNotify = true;
  }

  // Update state
  lastState.imgSrc = currentImgSrc;


  // --- Fallback / Auto-Detection Logic ---
  // If no specific selectors matched (or we want to support generic cases), we run the heuristic
  // Only run if we haven't already decided to notify based on specific selectors.

  if (!shouldNotify) {
    let currentHash = '';
    
    if (settings.selectors && settings.selectors.length > 0) {
      // Custom Selector Mode
      const parts = [];
      settings.selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
          const t = (el.innerText || '').trim();
          if (t) parts.push(t);
        }
      });
      currentHash = parts.join('|');
    } else {
      // Auto-Detection Mode Heuristics

      // Keywords
      const keywords = ['Polling', 'Question 1', 'Question 2', 'Question 3', 'Question 4', 'Question 5', 'Seconds Remaining'];
      const keywordMatch = keywords.find(k => bodyText.includes(k));
      if (keywordMatch) currentHash += `|KEY:${keywordMatch}`;

      // Submit Button
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      const activeSubmit = buttons.find(b =>
        !b.disabled &&
        (b.innerText.match(/Submit|Vote|Send/i) || b.value.match(/Submit|Vote|Send/i))
      );
      if (activeSubmit) currentHash += `|BTN:${activeSubmit.innerText}`;

      // Countdown
      if (bodyText.match(/\d{1,2}:\d{2}/)) currentHash += `|TIMER_PRESENT`;

      // Polling Status (Positive only)
      if (bodyText.match(/Polling|Poll Open/i)) currentHash += "|STATUS:POLLING";

      // Question Number
      const qMatch = bodyText.match(/Question \d+/i);
      if (qMatch) currentHash += `|${qMatch[0]}`;
    }

    // Logic: If hash changes from empty -> non-empty, or changes content significantly
    // We treat "Empty" as "No Question".
    if (currentHash !== lastState.hash) {
      if (lastState.hash === '' && currentHash !== '') {
        shouldNotify = true;
      } else if (lastState.hash !== '' && currentHash !== '') {
        // Change between two active states (e.g. Q1 -> Q2)
        shouldNotify = true;
      }
      // Note: If currentHash is empty (stopped), we do NOT notify.
    }

    lastState.hash = currentHash;
  }


  // --- Final Decision ---
  if (shouldNotify && !isPollingClosed) {
    console.log('iClicker Monitor: New question detected.', lastState);
    
    // Send Notification
    chrome.runtime.sendMessage({ action: 'NOTIFY' });
    
    // Play Sound if enabled
    if (settings.enableBeep) {
      playBeep();
    }
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
