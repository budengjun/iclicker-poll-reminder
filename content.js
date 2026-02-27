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
let isFirstCheck = true; // Skip notification on initial page load

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

  // Debug Log
  console.log('iClicker Monitor Debug:', {
    timestamp: new Date().toISOString(),
    isPollingClosed: /Polling\s+Closed/i.test(bodyText),
    lastState: JSON.parse(JSON.stringify(lastState)),
    bodySnippet: bodyText.substring(0, 100)
  });

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
  let decisionReason = '';

  // --- Specific Selector Logic ---

  // 1. Answer Container Logic
  // We look for .question-answer-container (standard iClicker class)
  const answerContainer = document.querySelector('.question-answer-container');
  const currentAnswerText = answerContainer ? answerContainer.innerText.trim() : '';

  // Rule: Only notify if transitioning from Empty -> Non-Empty
  if (lastState.answerText === '' && currentAnswerText !== '') {
    if (!/answer received/i.test(currentAnswerText)) {
      shouldNotify = true;
      decisionReason = 'Answer Text Appeared';
    }
  }

  // Update state
  lastState.answerText = currentAnswerText;


  // 2. Image Logic
  // We look for .question-image-container img.img-border (standard iClicker class)
  const imgElement = document.querySelector('.question-image-container img.img-border');
  // Only consider visible images (offsetParent is null for hidden elements)
  const isImgVisible = imgElement && imgElement.offsetParent !== null;
  const currentImgSrc = isImgVisible ? (imgElement.currentSrc || imgElement.src) : '';

  // Rule: Notify if src changes to a new, non-empty value
  // Note: If lastState.imgSrc was empty, and now we have one, that's a change.
  // If lastState.imgSrc was 'A', and now 'B', that's a change.
  if (currentImgSrc && currentImgSrc !== lastState.imgSrc) {
    shouldNotify = true;
    decisionReason = `Image Src Changed (New: ${currentImgSrc ? 'Yes' : 'No'})`;
  }

  // Update state
  lastState.imgSrc = currentImgSrc;


  // --- Fallback / Auto-Detection Logic ---
  // We ALWAYS calculate the hash to keep lastState.hash in sync, avoiding double-notifications
  // if we switch between specific logic and fallback logic (or if specific logic triggers first).

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

      // Submit Button (only visible ones)
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      const activeSubmit = buttons.find(b =>
        !b.disabled &&
        b.offsetParent !== null && // visible check: hidden elements have null offsetParent
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

  // Only use the hash change decision if we haven't already decided to notify via specific selectors
  // But we MUST update the state regardless.
  if (currentHash !== lastState.hash) {
    // Only set shouldNotify if it wasn't already true
    if (!shouldNotify) {
        if (lastState.hash === '' && currentHash !== '') {
            shouldNotify = true;
            decisionReason = 'Auto-Detect: Start';
        } else if (lastState.hash !== '' && currentHash !== '') {
            // Change between two active states (e.g. Q1 -> Q2)
            shouldNotify = true;
            decisionReason = 'Auto-Detect: Change';
        }
    }
  }

  lastState.hash = currentHash;

  // Debug Log Final
  if (shouldNotify) {
    console.log(`iClicker Monitor: Notify Decision TRUE. Reason: ${decisionReason}, PollingClosed: ${isPollingClosed}`);
  }

  // --- Final Decision ---
  // Never notify on the first check (initial page load) — only on changes
  if (isFirstCheck) {
    isFirstCheck = false;
    console.log('iClicker Monitor: Initial state recorded, skipping notification.');
    return;
  }

  if (shouldNotify && !isPollingClosed) {
    console.log('iClicker Monitor: New question detected.', lastState);
    
    try {
      // Send notification + play sound via background (bypasses autoplay policy)
      chrome.runtime.sendMessage({ action: 'NOTIFY' });
    } catch (e) {
      console.warn('iClicker Monitor: Extension context invalidated. Please refresh the page.');
    }

    // Show on-page visual notification (always works regardless of OS settings)
    showPageNotification('🔔 New iClicker Question!', 'A new question or poll has been detected.');
  }
}

function playNotificationChime() {
  try {
    const audio = new Audio(chrome.runtime.getURL('notification.wav'));
    audio.volume = 1.0;
    audio.play().catch(e => console.warn('iClicker Monitor: Audio play error', e));
  } catch (e) {
    console.warn('iClicker Monitor: Extension reloaded. Please refresh the page for audio.');
  }
}

function showPageNotification(title, message) {
  // Remove existing notification if any
  const existing = document.getElementById('iclicker-monitor-notification');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'iclicker-monitor-notification';
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #1a73e8, #0d47a1);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 350px;
      animation: iclickerSlideIn 0.4s ease-out;
      cursor: pointer;
    ">
      <div style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">${title}</div>
      <div style="font-size: 13px; opacity: 0.9;">${message}</div>
    </div>
    <style>
      @keyframes iclickerSlideIn {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes iclickerSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
      }
    </style>
  `;

  document.body.appendChild(banner);

  // Click to dismiss
  banner.addEventListener('click', () => banner.remove());

  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    const el = banner.querySelector('div');
    if (el) el.style.animation = 'iclickerSlideOut 0.4s ease-in forwards';
    setTimeout(() => banner.remove(), 400);
  }, 8000);
}
