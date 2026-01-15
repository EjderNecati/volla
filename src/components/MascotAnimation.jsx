import React from 'react';

/**
 * Dragon Mascot with SMOOTH WALKING ANIMATION
 * Among Us style - legs move, official platform logos on costume
 * SMALLER SIZE for better UX
 */
export default function MascotAnimation({ platform, isAnimating, onAnimationEnd }) {
    if (!isAnimating) return null;

    // Platform colors and logo paths
    const platformConfig = {
        amazon: { color: '#FF9900', suit: '#FF9900', logo: '/logo_amazon.png' },
        shopify: { color: '#96BF48', suit: '#96BF48', logo: '/logo_shopify.png' },
        etsy: { color: '#F1641E', suit: '#F1641E', logo: '/logo_etsy.jpg' }
    };

    const config = platformConfig[platform] || platformConfig.etsy;

    return (
        <div className="dragon-stage">
            {/* Light burst when dragon reaches center */}
            <div
                className="dragon-light"
                style={{ background: `radial-gradient(circle, ${config.color}50 0%, transparent 70%)` }}
            />

            {/* Dragon character - walks from right - SMALLER SIZE */}
            <div className="dragon-walker">
                <svg
                    viewBox="0 0 200 280"
                    width="120"
                    height="170"
                    className="dragon-svg"
                >
                    {/* SHADOW */}
                    <ellipse
                        cx="100" cy="265" rx="50" ry="12"
                        fill="rgba(0,0,0,0.15)"
                        className="dragon-shadow"
                    />

                    {/* LEFT LEG */}
                    <g className="dragon-leg-left">
                        <ellipse cx="70" cy="195" rx="18" ry="25" fill="#5D8A3A" />
                        <rect x="58" y="210" width="24" height="35" rx="10" fill="#5D8A3A" />
                        <ellipse cx="70" cy="250" rx="20" ry="10" fill="#5D8A3A" />
                        <path d="M50 240 Q50 260 70 260 Q90 260 90 240 L85 235 L55 235 Z" fill={config.suit} />
                    </g>

                    {/* RIGHT LEG */}
                    <g className="dragon-leg-right">
                        <ellipse cx="130" cy="195" rx="18" ry="25" fill="#5D8A3A" />
                        <rect x="118" y="210" width="24" height="35" rx="10" fill="#5D8A3A" />
                        <ellipse cx="130" cy="250" rx="20" ry="10" fill="#5D8A3A" />
                        <path d="M110 240 Q110 260 130 260 Q150 260 150 240 L145 235 L115 235 Z" fill={config.suit} />
                    </g>

                    {/* BODY */}
                    <g className="dragon-body-main">
                        <ellipse cx="100" cy="145" rx="55" ry="70" fill={config.suit} />
                        <ellipse cx="100" cy="155" rx="40" ry="45" fill={`${config.suit}CC`} />

                        {/* OFFICIAL LOGO on chest - using foreignObject for image */}
                        <foreignObject x="70" y="115" width="60" height="60">
                            <img
                                src={config.logo}
                                alt="logo"
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    background: 'white',
                                    padding: '5px'
                                }}
                            />
                        </foreignObject>
                    </g>

                    {/* BACKPACK */}
                    <rect x="145" y="110" width="25" height="50" rx="8" fill={config.suit} className="dragon-backpack" />
                    <rect x="150" y="115" width="15" height="15" rx="3" fill="#333" />

                    {/* WINGS */}
                    <g className="dragon-wings">
                        <path d="M40 100 Q20 80 25 110 Q30 130 45 120" fill="#7CB342" stroke="#5D8A3A" strokeWidth="2" />
                        <path d="M160 100 Q180 80 175 110 Q170 130 155 120" fill="#7CB342" stroke="#5D8A3A" strokeWidth="2" />
                    </g>

                    {/* HEAD */}
                    <g className="dragon-head">
                        <ellipse cx="100" cy="55" rx="45" ry="42" fill="rgba(200,230,255,0.3)" stroke="#AAA" strokeWidth="3" />
                        <ellipse cx="100" cy="58" rx="35" ry="32" fill="#7CB342" />
                        <ellipse cx="100" cy="70" rx="20" ry="12" fill="#8BC34A" />
                        <circle cx="92" cy="68" r="3" fill="#558B2F" />
                        <circle cx="108" cy="68" r="3" fill="#558B2F" />

                        <g className="dragon-eyes">
                            <ellipse cx="82" cy="50" rx="12" ry="14" fill="white" />
                            <ellipse cx="118" cy="50" rx="12" ry="14" fill="white" />
                            <circle cx="85" cy="52" r="7" fill="#1A1A1A" />
                            <circle cx="121" cy="52" r="7" fill="#1A1A1A" />
                            <circle cx="87" cy="50" r="2.5" fill="white" />
                            <circle cx="123" cy="50" r="2.5" fill="white" />
                        </g>

                        <ellipse cx="68" cy="62" rx="8" ry="5" fill="#FFB6C1" opacity="0.6" />
                        <ellipse cx="132" cy="62" rx="8" ry="5" fill="#FFB6C1" opacity="0.6" />
                        <path d="M85 78 Q100 88 115 78" stroke="#558B2F" strokeWidth="3" fill="none" strokeLinecap="round" />
                        <path d="M65 25 L58 8 L72 20 Z" fill="#8BC34A" />
                        <path d="M135 25 L142 8 L128 20 Z" fill="#8BC34A" />
                        <ellipse cx="75" cy="35" rx="12" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(-20 75 35)" />
                    </g>

                    {/* TAIL */}
                    <path
                        d="M155 170 Q175 175 185 160 Q195 145 185 150"
                        fill="#7CB342"
                        stroke="#5D8A3A"
                        strokeWidth="2"
                        className="dragon-tail"
                    />
                    <path d="M185 160 L198 155 L188 168 Z" fill="#8BC34A" />

                    {/* ARM */}
                    <g className="dragon-arm">
                        <ellipse cx="45" cy="140" rx="15" ry="20" fill={config.suit} />
                        <ellipse cx="35" cy="155" rx="12" ry="15" fill="#7CB342" />
                    </g>
                </svg>
            </div>

            <style>{`
                .dragon-stage {
                    position: fixed;
                    inset: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    overflow: hidden;
                }

                .dragon-light {
                    position: absolute;
                    width: 100vw;
                    height: 100vh;
                    animation: lightFlash 2.5s ease-out 2s forwards;
                    opacity: 0;
                }

                .dragon-walker {
                    animation: walkAcross 2.5s ease-out forwards;
                }

                .dragon-svg {
                    filter: drop-shadow(0 8px 20px rgba(0,0,0,0.25));
                }

                .dragon-leg-left {
                    transform-origin: 70px 180px;
                    animation: legSwingLeft 0.25s ease-in-out infinite;
                }

                .dragon-leg-right {
                    transform-origin: 130px 180px;
                    animation: legSwingRight 0.25s ease-in-out infinite;
                }

                .dragon-body-main,
                .dragon-head,
                .dragon-backpack {
                    animation: bodyBounce 0.25s ease-in-out infinite;
                }

                .dragon-shadow {
                    animation: shadowPulse 0.25s ease-in-out infinite;
                }

                .dragon-wings {
                    animation: wingFlutter 0.15s ease-in-out infinite alternate;
                }

                .dragon-tail {
                    transform-origin: 155px 170px;
                    animation: tailWag 0.3s ease-in-out infinite alternate;
                }

                .dragon-arm {
                    transform-origin: 55px 140px;
                    animation: armWave 0.5s ease-in-out infinite alternate;
                }

                .dragon-eyes {
                    animation: blink 2.5s ease-in-out infinite;
                }

                @keyframes walkAcross {
                    0% { 
                        transform: translateX(calc(50vw + 80px));
                        opacity: 0;
                    }
                    5% { opacity: 1; }
                    80% { 
                        transform: translateX(0);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes legSwingLeft {
                    0%, 100% { transform: rotate(-15deg); }
                    50% { transform: rotate(15deg); }
                }

                @keyframes legSwingRight {
                    0%, 100% { transform: rotate(15deg); }
                    50% { transform: rotate(-15deg); }
                }

                @keyframes bodyBounce {
                    0%, 100% { transform: translateY(0); }
                    25% { transform: translateY(-2px); }
                    75% { transform: translateY(-2px); }
                }

                @keyframes shadowPulse {
                    0%, 100% { rx: 50; opacity: 0.15; }
                    50% { rx: 45; opacity: 0.2; }
                }

                @keyframes wingFlutter {
                    0% { transform: rotate(-3deg); }
                    100% { transform: rotate(3deg); }
                }

                @keyframes tailWag {
                    0% { transform: rotate(-8deg); }
                    100% { transform: rotate(8deg); }
                }

                @keyframes armWave {
                    0% { transform: rotate(-5deg); }
                    100% { transform: rotate(10deg); }
                }

                @keyframes blink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                }

                @keyframes lightFlash {
                    0% { opacity: 0; transform: scale(0.5); }
                    30% { opacity: 1; }
                    100% { opacity: 0; transform: scale(3); }
                }
            `}</style>
        </div>
    );
}
