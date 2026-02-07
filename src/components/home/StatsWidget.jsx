import React, { useState, useEffect } from 'react';
import { Coins, Image, FolderOpen, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useCredits } from '../../contexts/CreditContext';
import { getProjects } from '../../utils/projectManager';

/**
 * StatsWidget - Kullanım istatistikleri widget
 * Credits, bu ay üretim, proje sayısı gösterir
 */

export default function StatsWidget({ onNavigate }) {
    const { t } = useTranslation();
    const { credits, planName } = useCredits();
    const [projectCount, setProjectCount] = useState(0);
    const [thisMonthCount, setThisMonthCount] = useState(0);

    // Calculate stats from projects
    useEffect(() => {
        try {
            const projects = getProjects();
            setProjectCount(projects.length);

            // Count this month's projects
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisMonth = projects.filter(p => {
                const created = new Date(p.createdAt);
                return created >= startOfMonth;
            });
            setThisMonthCount(thisMonth.length);
        } catch (err) {
            console.error('Failed to load project stats:', err);
        }
    }, []);

    const stats = [
        {
            icon: Coins,
            value: credits || 0,
            label: t('home.stats.credits') || 'Credits',
            gradient: 'from-emerald-500 to-teal-500',
            onClick: () => onNavigate && onNavigate('pricing')
        },
        {
            icon: Image,
            value: thisMonthCount,
            label: t('home.stats.generated') || 'This Month',
            gradient: 'from-violet-500 to-purple-500',
            onClick: null
        },
        {
            icon: FolderOpen,
            value: projectCount,
            label: t('home.stats.projects') || 'Projects',
            gradient: 'from-[#E06847] to-[#C85A3D]',
            onClick: () => onNavigate && onNavigate('history')
        }
    ];

    return (
        <section className="mb-10">
            <h2 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider mb-4">
                {t('home.stats.title') || 'Your Usage'}
            </h2>

            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const Wrapper = stat.onClick ? 'button' : 'div';

                    return (
                        <Wrapper
                            key={index}
                            onClick={stat.onClick}
                            className={`bg-white border border-[#E8E7E4] rounded-xl p-5 transition-all ${stat.onClick ? 'hover:shadow-md hover:border-[#1A1A1A]/10 cursor-pointer' : ''}`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                {stat.onClick && (
                                    <TrendingUp className="w-4 h-4 text-[#8C8C8C] ml-auto" />
                                )}
                            </div>
                            <p className="text-2xl font-bold text-[#1A1A1A] mb-1">
                                {stat.value}
                            </p>
                            <p className="text-xs text-[#8C8C8C]">
                                {stat.label}
                            </p>
                        </Wrapper>
                    );
                })}
            </div>

            {/* Plan indicator */}
            {planName && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#8C8C8C]">
                    <span className="px-2 py-0.5 bg-[#F5F4F1] rounded-full font-medium">
                        {planName}
                    </span>
                    <span>Plan</span>
                </div>
            )}
        </section>
    );
}
