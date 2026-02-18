/**
 * MarketInsights Component
 * Displays real market data: price ranges, popular tags, trends
 * Uses only official APIs (Etsy API, Google Trends) - no scraping
 */
import React from 'react';
import { TrendingUp, DollarSign, Tag, ShoppingBag, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function MarketInsights({
  marketData,
  trendsData,
  marketplace,
  errors = []
}) {
  const { t } = useTranslation();

  // No data state
  if (!marketData && !trendsData) {
    return (
      <div className="text-center py-8 text-[#8C8C8C]">
        <ShoppingBag size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">
          {t('marketInsights.noData') || 'Run analysis to see market insights'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} />
            <span className="font-medium">{t('marketInsights.someDataUnavailable') || 'Some data unavailable'}</span>
          </div>
          <ul className="text-xs list-disc list-inside opacity-80">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Market Price Data (Etsy only) */}
      {marketData && !marketData.apiKeyMissing && (
        <div className="bg-[#F5F4F1] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-[#1A1A1A]">
            <DollarSign size={16} className="text-green-600" />
            {t('marketInsights.marketPrices') || 'Market Prices'}
            {marketData.totalCount > 0 && (
              <span className="text-xs font-normal text-[#8C8C8C] ml-auto">
                {marketData.totalCount.toLocaleString()} {t('marketInsights.listings') || 'listings'}
              </span>
            )}
          </h3>

          {/* Price Range Visualization */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="text-center min-w-[50px]">
                <div className="text-[10px] text-[#8C8C8C]">Min</div>
                <div className="font-semibold text-green-600 text-sm">${marketData.minPrice}</div>
              </div>
              <div className="flex-1 relative">
                <div className="h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full" />
                {marketData.avgPrice > 0 && (
                  <div
                    className="absolute w-3 h-3 bg-white border-2 border-[#1A1A1A] rounded-full -top-0.5 transform -translate-x-1/2"
                    style={{
                      left: `${Math.min(100, Math.max(0, ((marketData.avgPrice - marketData.minPrice) / (marketData.maxPrice - marketData.minPrice)) * 100))}%`
                    }}
                  />
                )}
              </div>
              <div className="text-center min-w-[50px]">
                <div className="text-[10px] text-[#8C8C8C]">Max</div>
                <div className="font-semibold text-red-500 text-sm">${marketData.maxPrice}</div>
              </div>
            </div>
            <div className="text-center mt-2 text-sm">
              {t('marketInsights.average') || 'Average'}: <span className="font-bold text-[#1A1A1A]">${marketData.avgPrice}</span>
            </div>
          </div>
        </div>
      )}

      {/* API Key Missing Warning */}
      {marketData?.apiKeyMissing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{t('marketInsights.etsyApiKeyMissing') || 'Add ETSY_API_KEY to Vercel for market data'}</span>
          </div>
        </div>
      )}

      {/* Popular Tags (from market search) */}
      {marketData?.topTags && marketData.topTags.length > 0 && (
        <div className="bg-[#F5F4F1] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-[#1A1A1A]">
            <Tag size={16} className="text-violet-600" />
            {t('marketInsights.popularTags') || 'Popular Tags'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {marketData.topTags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-white rounded-full text-xs text-[#5C5C5C] border border-[#E8E7E4] hover:border-violet-300 transition-colors cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Google Trends */}
      {trendsData && (
        <div className="bg-[#F5F4F1] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-[#1A1A1A]">
            <TrendingUp size={16} className="text-blue-600" />
            {t('marketInsights.searchTrends') || 'Search Trends'}
            <span className="text-xs font-normal text-[#8C8C8C] ml-auto">
              {trendsData.timeframe || 'Last 3 months'}
            </span>
          </h3>

          {/* Simple Trend Visualization */}
          {trendsData.trend && trendsData.trend.length > 0 && (
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-end gap-1 h-16">
                {trendsData.trend.slice(-12).map((point, i) => {
                  const keyword = trendsData.keywords?.[0];
                  const value = keyword && point.values?.[keyword] ? point.values[keyword] : 50;
                  const height = Math.max(10, (value / 100) * 100);
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all hover:from-blue-600 hover:to-blue-400"
                      style={{ height: `${height}%` }}
                      title={`${point.date}: ${value}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-[#8C8C8C]">
                <span>{trendsData.trend[0]?.date}</span>
                <span>{trendsData.trend[trendsData.trend.length - 1]?.date}</span>
              </div>
            </div>
          )}

          {/* Rising Keywords */}
          {trendsData.risingKeywords && trendsData.risingKeywords.length > 0 && (
            <div>
              <span className="text-xs text-[#8C8C8C] block mb-1.5">
                {t('marketInsights.risingKeywords') || 'Rising Keywords'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {trendsData.risingKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-medium"
                  >
                    <TrendingUp size={10} className="inline mr-1" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
