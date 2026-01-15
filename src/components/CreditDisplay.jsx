import React from 'react';
import { Coins, Zap } from 'lucide-react';
import { useCredits } from '../contexts/CreditContext';

const CreditDisplay = ({ onClick }) => {
    const { credits, plan, PLANS } = useCredits();
    const currentPlan = PLANS[plan];
    const isLowCredits = credits < 10;

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80 ${isLowCredits
                    ? 'bg-red-100 text-red-600'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
        >
            <Coins size={12} className={isLowCredits ? 'text-red-500' : 'text-emerald-500'} />
            <span className="font-bold">{credits}</span>
            <span className="opacity-50">•</span>
            <span className="capitalize">{currentPlan?.name || 'Free'}</span>
        </button>
    );
};

export default CreditDisplay;
