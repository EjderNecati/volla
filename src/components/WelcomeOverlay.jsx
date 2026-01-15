import React from 'react';

/**
 * Subtle dark mode overlay for welcome state
 * Platform selector buttons glow to indicate selection needed
 * NO hint text - let the glowing buttons speak for themselves
 */
export default function WelcomeOverlay({ isActive }) {
    if (!isActive) return null;

    return (
        <>
            {/* Subtle dark mode filter */}
            <div className="welcome-dark-mode" />

            <style>{`
                .welcome-dark-mode {
                    position: fixed;
                    inset: 0;
                    z-index: 40;
                    background: rgba(26, 26, 26, 0.35);
                    pointer-events: none;
                    animation: darkModeIn 0.4s ease-out;
                }

                @keyframes darkModeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
            `}</style>
        </>
    );
}
