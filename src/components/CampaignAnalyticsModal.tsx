import React, { useEffect, useState } from 'react';
import { X, RefreshCw, TrendingUp, Eye, Users, AlertCircle } from 'lucide-react';
import { campaignAnalyticsService, CampaignAnalytics } from '../services/campaign-analytics';
import { AnalyticsGrid } from './AnalyticsDisplay';
import { toast } from 'sonner';

interface CampaignAnalyticsModalProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignAnalyticsModal({ campaignId, isOpen, onClose }: CampaignAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchAnalytics();
    }
  }, [isOpen, campaignId]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await campaignAnalyticsService.fetchCampaignAnalytics(campaignId);
      
      if (!data) {
        setError('Campaign not found');
      } else if (data.contentAnalytics.length === 0) {
        setError('No content URLs found for this campaign. Please add content URLs and try again.');
      } else {
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const data = await campaignAnalyticsService.refreshCampaignAnalytics(campaignId);
      
      if (data) {
        setAnalytics(data);
        toast.success('Analytics refreshed successfully');
      } else {
        toast.error('Failed to refresh analytics');
      }
    } catch (err) {
      console.error('Error refreshing analytics:', err);
      toast.error('Failed to refresh analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {analytics?.campaignName || 'Campaign'} Analytics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading analytics...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Analytics Error</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total Views</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {analytics.totalViews.toLocaleString()}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Total Engagement</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {analytics.totalEngagement.toLocaleString()}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Average Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {analytics.averageRate.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Content Analytics</h3>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Analytics'}
                </button>
              </div>

              {/* Content Analytics Grid */}
              <AnalyticsGrid
                items={analytics.contentAnalytics.map(item => ({
                  url: item.url,
                  platform: item.platform,
                  analytics: {
                    views: item.views,
                    engagement: item.engagement,
                    rate: item.rate,
                  },
                }))}
              />

              {/* Last Updated */}
              <div className="text-sm text-gray-500 text-center">
                Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Hook to manage modal state
export function useCampaignAnalyticsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const openModal = (id: string) => {
    setCampaignId(id);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCampaignId(null);
  };

  return {
    isOpen,
    campaignId,
    openModal,
    closeModal,
  };
}