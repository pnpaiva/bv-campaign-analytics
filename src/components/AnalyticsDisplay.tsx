import React from 'react';
import { AlertCircle, TrendingUp, Eye, Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AnalyticsData {
  views: number;
  engagement: number;
  rate: number;
  error?: string;
  fetchedAt?: string;
}

interface AnalyticsDisplayProps {
  url: string;
  platform: string;
  analytics: AnalyticsData;
  showError?: boolean;
}

export function AnalyticsDisplay({ url, platform, analytics, showError = true }: AnalyticsDisplayProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getPlatformColor = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return 'text-red-600';
      case 'instagram':
        return 'text-pink-600';
      case 'tiktok':
        return 'text-black';
      default:
        return 'text-gray-600';
    }
  };

  const getPlatformIcon = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return '🎥';
      case 'instagram':
        return '📷';
      case 'tiktok':
        return '🎵';
      default:
        return '🌐';
    }
  };

  const getPlatformBgColor = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return 'bg-red-50';
      case 'instagram':
        return 'bg-pink-50';
      case 'tiktok':
        return 'bg-gray-50';
      default:
        return 'bg-gray-50';
    }
  };

  if (analytics.error && showError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Analytics temporarily unavailable
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Using default values for {platform}
            </p>
            <p className="text-xs text-gray-500 mt-2 truncate">
              {url}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getPlatformBgColor(platform)} border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getPlatformIcon(platform)}</span>
          <span className={`font-medium capitalize ${getPlatformColor(platform)}`}>
            {platform}
          </span>
        </div>
        {analytics.error && (
          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
            Default data
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-400 mb-1">
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatNumber(analytics.views)}
          </div>
          <div className="text-xs text-gray-500">Views</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center text-gray-400 mb-1">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatNumber(analytics.engagement)}
          </div>
          <div className="text-xs text-gray-500">Likes</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center text-gray-400 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {analytics.rate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Eng. Rate</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 truncate" title={url}>
          {url}
        </p>
        {analytics.fetchedAt && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Updated {formatDistanceToNow(new Date(analytics.fetchedAt), { addSuffix: true })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Analytics Grid Component
interface AnalyticsGridProps {
  items: Array<{
    url: string;
    platform: string;
    analytics: AnalyticsData;
  }>;
}

export function AnalyticsGrid({ items }: AnalyticsGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <AnalyticsDisplay
          key={index}
          url={item.url}
          platform={item.platform}
          analytics={item.analytics}
        />
      ))}
    </div>
  );
}