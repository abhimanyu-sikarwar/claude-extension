// Wrapper for Firefox compatibility with Manifest V2
// This file loads the main background script for Firefox

// Use browser API if available (Firefox), otherwise use chrome
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
    window.browser = chrome;
}

// Import the main background script
importScripts('background.js');