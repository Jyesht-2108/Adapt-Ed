// Dyslexia Mode Chrome Extension - Content Script
(function () {
  'use strict';

  // State management
  let isDyslexiaMode = false;

  // Initialize
  init();

  function init() {
    if (!document.body) {
      setTimeout(init, 100);
      return;
    }

    chrome.storage.local.get(['dyslexiaMode'], (result) => {
      isDyslexiaMode = result.dyslexiaMode || false;
      createToggleButton();
      if (isDyslexiaMode) {
        applyDyslexiaMode();
      }
    });
  }

  function createToggleButton() {
    const existing = document.getElementById('dyslexia-toggle-container');
    if (existing) existing.remove();

    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'dyslexia-toggle-container';
    toggleContainer.innerHTML = `
      <style>
        #dyslexia-toggle-container {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 2147483647;
          font-family: Arial, sans-serif;
        }
        #dyslexia-toggle-btn {
          background: #4A90E2;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #dyslexia-toggle-btn:hover {
          background: #357ABD;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        #dyslexia-toggle-btn.active {
          background: #27AE60;
        }
        #dyslexia-toggle-btn.active:hover {
          background: #229954;
        }
        .dyslexia-toggle-icon {
          width: 16px;
          height: 16px;
          border: 2px solid white;
          border-radius: 50%;
          position: relative;
        }
        .dyslexia-toggle-icon::after {
          content: '';
          position: absolute;
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: opacity 0.3s;
        }
        #dyslexia-toggle-btn.active .dyslexia-toggle-icon::after {
          opacity: 1;
        }
        #dyslexia-toggle-btn:not(.active) .dyslexia-toggle-icon::after {
          opacity: 0;
        }
      </style>
      <button id="dyslexia-toggle-btn" class="${isDyslexiaMode ? 'active' : ''}">
        <span class="dyslexia-toggle-icon"></span>
        <span>Dyslexia Mode</span>
      </button>
    `;

    document.body.appendChild(toggleContainer);
    document.getElementById('dyslexia-toggle-btn').addEventListener('click', toggleDyslexiaMode);
  }

  function toggleDyslexiaMode() {
    isDyslexiaMode = !isDyslexiaMode;
    const button = document.getElementById('dyslexia-toggle-btn');

    if (isDyslexiaMode) {
      button.classList.add('active');
      applyDyslexiaMode();
    } else {
      button.classList.remove('active');
      restoreOriginalText();
    }

    chrome.storage.local.set({ dyslexiaMode: isDyslexiaMode });
  }

  function applyDyslexiaMode() {
    // CSS-ONLY - no DOM manipulation to avoid React conflicts
    injectDyslexiaStyles();
    document.body.classList.add('dyslexia-mode-active');
  }

  function injectDyslexiaStyles() {
    let styleEl = document.getElementById('dyslexia-mode-styles');

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dyslexia-mode-styles';
      document.head.appendChild(styleEl);
    }

    // Pure CSS - no DOM changes, won't conflict with React
    styleEl.textContent = `
      body.dyslexia-mode-active * {
        font-family: "OpenDyslexic", Arial, Verdana, sans-serif !important;
        line-height: 2.0 !important;
        letter-spacing: 0.08em !important;
        word-spacing: 0.20em !important;
        font-weight: 600 !important;  /* Semi-bold text for better readability */
      }
      body.dyslexia-mode-active {
        font-size: 125% !important;
      }
      #dyslexia-toggle-container * {
        font-family: Arial, sans-serif !important;
        line-height: normal !important;
        letter-spacing: normal !important;
        word-spacing: normal !important;
        font-weight: 600 !important;
      }
    `;
  }

  function restoreOriginalText() {
    // Just remove the CSS class - no DOM manipulation
    const styleEl = document.getElementById('dyslexia-mode-styles');
    if (styleEl) styleEl.remove();
    document.body.classList.remove('dyslexia-mode-active');
  }

})();