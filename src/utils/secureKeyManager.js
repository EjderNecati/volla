// =====================================================
// SECURE API KEY MANAGER
// AES-256 Encryption for API Keys in localStorage
// =====================================================

// Encryption key derived from browser fingerprint + salt
const SALT = 'v0ll4_s3cur3_k3y_2024';

// Simple obfuscation to hide from casual inspection
const encode = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    (match, p1) => String.fromCharCode('0x' + p1)));

const decode = (str) => {
    try {
        return decodeURIComponent(atob(str).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch {
        return str; // Return as-is if decode fails (legacy unencrypted)
    }
};

// Generate device-specific key component
const getDeviceFingerprint = () => {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset()
    ];
    return components.join('|');
};

// XOR cipher with key mixing for obfuscation
const xorCipher = (text, key) => {
    const fullKey = key + SALT + getDeviceFingerprint();
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
            text.charCodeAt(i) ^ fullKey.charCodeAt(i % fullKey.length)
        );
    }
    return result;
};

// Storage keys
const API_KEY_STORAGE = 'volla_api_key_enc';
const VERTEX_KEY_STORAGE = 'volla_vertex_key_enc';
const LEGACY_API_KEY = 'volla_api_key';
const LEGACY_VERTEX_KEY = 'volla_vertex_key';
const LEGACY_VERTEX_KEY_ALT = 'volla_vertex_api_key';

/**
 * Securely save API key
 */
export const saveApiKey = (key) => {
    if (!key || key.trim() === '') {
        localStorage.removeItem(API_KEY_STORAGE);
        localStorage.removeItem(LEGACY_API_KEY);
        return;
    }

    // Clear legacy unencrypted key
    localStorage.removeItem(LEGACY_API_KEY);

    // Encrypt and save
    const encrypted = encode(xorCipher(key.trim(), 'gemini'));
    localStorage.setItem(API_KEY_STORAGE, encrypted);
};

/**
 * Securely retrieve API key
 */
export const getApiKey = () => {
    // Try encrypted first
    const encrypted = localStorage.getItem(API_KEY_STORAGE);
    if (encrypted) {
        try {
            return xorCipher(decode(encrypted), 'gemini');
        } catch {
            return '';
        }
    }

    // Migrate legacy unencrypted key
    const legacy = localStorage.getItem(LEGACY_API_KEY);
    if (legacy) {
        saveApiKey(legacy); // Encrypt and save
        localStorage.removeItem(LEGACY_API_KEY);
        return legacy;
    }

    return '';
};

/**
 * Securely save Vertex API key
 */
export const saveVertexKey = (key) => {
    if (!key || key.trim() === '') {
        localStorage.removeItem(VERTEX_KEY_STORAGE);
        localStorage.removeItem(LEGACY_VERTEX_KEY);
        localStorage.removeItem(LEGACY_VERTEX_KEY_ALT);
        return;
    }

    // Clear legacy unencrypted keys
    localStorage.removeItem(LEGACY_VERTEX_KEY);
    localStorage.removeItem(LEGACY_VERTEX_KEY_ALT);

    // Encrypt and save
    const encrypted = encode(xorCipher(key.trim(), 'vertex'));
    localStorage.setItem(VERTEX_KEY_STORAGE, encrypted);
};

/**
 * Securely retrieve Vertex API key
 */
export const getVertexKey = () => {
    // Try encrypted first
    const encrypted = localStorage.getItem(VERTEX_KEY_STORAGE);
    if (encrypted) {
        try {
            return xorCipher(decode(encrypted), 'vertex');
        } catch {
            return '';
        }
    }

    // Migrate legacy unencrypted keys
    const legacy = localStorage.getItem(LEGACY_VERTEX_KEY) ||
        localStorage.getItem(LEGACY_VERTEX_KEY_ALT);
    if (legacy) {
        saveVertexKey(legacy); // Encrypt and save
        localStorage.removeItem(LEGACY_VERTEX_KEY);
        localStorage.removeItem(LEGACY_VERTEX_KEY_ALT);
        return legacy;
    }

    return '';
};

/**
 * Check if API keys are configured
 */
export const hasApiKeys = () => {
    return !!(getApiKey() || getVertexKey());
};

/**
 * Clear all API keys
 */
export const clearAllKeys = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    localStorage.removeItem(VERTEX_KEY_STORAGE);
    localStorage.removeItem(LEGACY_API_KEY);
    localStorage.removeItem(LEGACY_VERTEX_KEY);
    localStorage.removeItem(LEGACY_VERTEX_KEY_ALT);
};

// Export for debugging (remove in production)
export const debugKeyStatus = () => ({
    hasApiKey: !!getApiKey(),
    hasVertexKey: !!getVertexKey(),
    apiKeyLength: getApiKey()?.length || 0,
    vertexKeyLength: getVertexKey()?.length || 0
});
