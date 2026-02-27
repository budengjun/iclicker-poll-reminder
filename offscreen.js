// Offscreen document: plays notification sound immediately on load
const audio = new Audio(chrome.runtime.getURL('notification.wav'));
audio.volume = 1.0;
audio.play()
  .then(() => console.log('Offscreen: chime playing'))
  .catch(e => console.warn('Offscreen: play error', e));
