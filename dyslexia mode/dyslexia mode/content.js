// AdaptEd Content Script - Dyslexia Mode Toggle

let dyslexiaModeActive = false;
let readingRuler = null;
let toggleButton = null;

// Initialize on load
(async function init() {
  // Load saved state from storage
  const result = await chrome.storage.local.get(['dyslexiaModeActive']);
  dyslexiaModeActive = result.dyslexiaModeActive || false;
  
  // Create floating toggle button
  createToggleButton();
  
  // Apply mode if it was previously active
  if (dyslexiaModeActive) {
    enableDyslexiaMode();
  }
  
  // Create reading ruler element
  createReadingRuler();
})();

// Listen for toggle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleDyslexiaMode') {
    dyslexiaModeActive = message.enabled;
    
    if (dyslexiaModeActive) {
      enableDyslexiaMode();
    } else {
      disableDyslexiaMode();
    }
    
    updateToggleButton();
    sendResponse({ success: true });
  }
});

function createToggleButton() {
  // Create floating toggle button
  toggleButton = document.createElement('div');
  toggleButton.id = 'dyslexia-toggle-button';
  toggleButton.innerHTML = `
    <div class="toggle-content">
      <span class="toggle-icon">📖</span>
      <span class="toggle-text">Dyslexia Mode</span>
      <div class="toggle-switch ${dyslexiaModeActive ? 'active' : ''}">
        <div class="toggle-slider"></div>
      </div>
    </div>
  `;
  
  // Add click handler
  toggleButton.addEventListener('click', async () => {
    dyslexiaModeActive = !dyslexiaModeActive;
    
    // Save to storage
    await chrome.storage.local.set({ dyslexiaModeActive: dyslexiaModeActive });
    
    // Toggle mode
    if (dyslexiaModeActive) {
      enableDyslexiaMode();
    } else {
      disableDyslexiaMode();
    }
    
    updateToggleButton();
  });
  
  document.body.appendChild(toggleButton);
}

function updateToggleButton() {
  if (!toggleButton) return;
  
  const toggleSwitch = toggleButton.querySelector('.toggle-switch');
  if (dyslexiaModeActive) {
    toggleSwitch.classList.add('active');
  } else {
    toggleSwitch.classList.remove('active');
  }
}

function createReadingRuler() {
  // Only create if it doesn't exist
  if (readingRuler) return;
  
  readingRuler = document.createElement('div');
  readingRuler.id = 'reading-ruler';
  document.body.appendChild(readingRuler);
}

function enableDyslexiaMode() {
  // Add the dyslexia-active class to body
  document.body.classList.add('dyslexia-active');
  
  // Activate reading ruler
  if (readingRuler) {
    readingRuler.classList.add('active');
  }
  
  // Add mousemove listener for reading ruler
  document.addEventListener('mousemove', updateRulerPosition);
}

function disableDyslexiaMode() {
  // Remove the dyslexia-active class from body
  document.body.classList.remove('dyslexia-active');
  
  // Deactivate reading ruler
  if (readingRuler) {
    readingRuler.classList.remove('active');
  }
  
  // Remove mousemove listener
  document.removeEventListener('mousemove', updateRulerPosition);
}

function updateRulerPosition(e) {
  if (readingRuler && dyslexiaModeActive) {
    // Position ruler at cursor Y position (centered on cursor)
    readingRuler.style.top = `${e.clientY - 20}px`;
  }
}
