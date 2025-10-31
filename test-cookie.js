// Test script to check if lastActiveOrg cookie exists and can be read
// Run this in the browser console on claude.ai

(function testCookieDetection() {
    console.log('=== Testing Cookie Detection ===');

    // Method 1: Direct document.cookie check
    console.log('All cookies:', document.cookie);

    // Method 2: Parse cookies
    const cookies = document.cookie.split(';');
    let lastActiveOrg = null;

    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'lastActiveOrg') {
            console.log('Found lastActiveOrg cookie!');
            console.log('Raw value:', value);

            try {
                const decoded = decodeURIComponent(value);
                console.log('Decoded value:', decoded);

                // Try to parse as JSON
                try {
                    const parsed = JSON.parse(decoded);
                    console.log('Parsed JSON:', parsed);
                    lastActiveOrg = parsed.uuid || parsed.id || parsed.organizationId || parsed;
                } catch {
                    // Not JSON, use direct value
                    console.log('Not JSON, using direct value');
                    lastActiveOrg = decoded;
                }
            } catch (e) {
                console.log('Error decoding:', e);
            }
            break;
        }
    }

    if (lastActiveOrg) {
        console.log('✅ Organization ID found:', lastActiveOrg);

        // Validate format
        if (typeof lastActiveOrg === 'string' && lastActiveOrg.match(/^[a-f0-9-]{36}$/)) {
            console.log('✅ Valid UUID format');
        } else {
            console.log('⚠️ Invalid UUID format');
        }
    } else {
        console.log('❌ lastActiveOrg cookie not found');
        console.log('Available cookie names:', cookies.map(c => c.trim().split('=')[0]));
    }

    console.log('=== Test Complete ===');
})();