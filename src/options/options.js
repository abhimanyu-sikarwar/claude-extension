// SPDX-License-Identifier: Apache-2.0
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const tokenInput = document.getElementById('github-token');
    const saveButton = document.getElementById('save');
    const status = document.getElementById('status');

    // Export preference elements
    const msgAllRadio = document.getElementById('msg-all');
    const msgAssistantRadio = document.getElementById('msg-assistant');
    const includeThinkingCheckbox = document.getElementById('include-thinking');

    // Load saved settings
    chrome.storage.local.get(['githubToken', 'exportPreferences'], function(data) {
      // Load GitHub token
      if (data.githubToken) {
        tokenInput.value = data.githubToken;
      }

      // Load export preferences
      if (data.exportPreferences) {
        // Message type
        if (data.exportPreferences.messageType === 'assistant') {
          msgAssistantRadio.checked = true;
        } else {
          msgAllRadio.checked = true;
        }

        // Include thinking
        if (data.exportPreferences.includeThinking !== undefined) {
          includeThinkingCheckbox.checked = data.exportPreferences.includeThinking;
        }
      }
    });

    function showStatus(message, isError = false) {
      status.textContent = message;
      status.className = `show ${isError ? 'error' : 'success'}`;
      setTimeout(() => {
        status.className = 'hide';
      }, 3000);
    }

    saveButton.addEventListener('click', function() {
      const token = tokenInput.value.trim();

      // Get export preferences
      const messageType = msgAssistantRadio.checked ? 'assistant' : 'all';
      const includeThinking = includeThinkingCheckbox.checked;

      // Save all settings
      chrome.storage.local.set({
        githubToken: token,
        exportPreferences: {
          messageType: messageType,
          includeThinking: includeThinking
        }
      }, function() {
        if (chrome.runtime.lastError) {
          showStatus('Error saving settings: ' + chrome.runtime.lastError.message, true);
        } else {
          showStatus('Settings saved successfully!');
          console.log('Saved preferences:', {
            hasToken: !!token,
            messageType: messageType,
            includeThinking: includeThinking
          });
        }
      });
    });

    // Add visual feedback for radio button selection
    const radioLabels = document.querySelectorAll('.radio-label');
    radioLabels.forEach(label => {
      label.addEventListener('click', function() {
        // Update visual state immediately
        radioLabels.forEach(l => l.style.backgroundColor = '');
        if (label.querySelector('input:checked')) {
          label.style.backgroundColor = '#eff6ff';
        }
      });
    });
  });
