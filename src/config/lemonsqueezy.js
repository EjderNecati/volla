// =====================================================
// LEMONSQUEEZY CONFIGURATION
// Checkout links for subscription plans
// =====================================================

export const LEMONSQUEEZY_CONFIG = {
    storeId: 271817,

    // Checkout UUIDs for each plan (single link covers both monthly/yearly)
    checkoutLinks: {
        starter: 'd8130ac5-21ed-4b05-b253-bad36b3f2259',
        pro: 'c9100c25-de84-4d67-ba0d-e232ce1253d4',
        business: '43f0f965-9743-4a01-af42-fa37b7de9794'
    },

    // URLs
    successUrl: 'https://www.volla.app/?payment=success',
    cancelUrl: 'https://www.volla.app/?payment=cancelled'
};

// Get checkout UUID for a plan
export const getCheckoutId = (planId) => {
    return LEMONSQUEEZY_CONFIG.checkoutLinks[planId] || null;
};

// Build checkout URL (direct LemonSqueezy URL)
export const buildCheckoutUrl = (planId, email = null) => {
    const checkoutId = getCheckoutId(planId);
    if (!checkoutId) return null;

    let url = `https://volla.lemonsqueezy.com/checkout/buy/${checkoutId}`;

    const params = new URLSearchParams();
    if (email) {
        params.append('checkout[email]', email);
        params.append('checkout[custom][user_email]', email);
    }

    // Add redirect URLs
    params.append('checkout[success_url]', LEMONSQUEEZY_CONFIG.successUrl);

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Legacy function for compatibility
export const getVariantId = (planId) => getCheckoutId(planId);

export default LEMONSQUEEZY_CONFIG;
