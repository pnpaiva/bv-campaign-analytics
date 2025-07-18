import React from 'react';
import { BarChart, Edit, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  brand?: string;
  creator?: string;
  status: string;
  created_at: string;
  content_urls?: Array<{
    url: string;
    platform?: string;
    analytics?: {
      views: number;
      engagement: number;
      rate: number;
    };
  }>;
  analytics_updated_at?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  onAnalyticsClick: (campaignId: string) => void;
  onEdit?: (campaign: Campaign) => void;
  onRefresh?: (campaignId: string) => void;
  onDelete?: (campaignId: string) => void;
}

export function CampaignCard({ 
  campaign, 
  onAnalyticsClick, 
  onEdit, 
  onRefresh, 
  onDelete 
}: CampaignCardProps) {
  // Calculate totals from content URLs
  const totals = campaign.content_urls?.reduce(
    (acc, item) => ({
      views: acc.views + (item.analytics?.views || 0),
      engagement: acc.engagement + (item.analytics?.engagement || 0),
      urls: acc.urls + 1,
    }),
    { views: 0, engagement: 0, urls: 0 }
  ) || { views: 0, engagement: 0, urls: 0 };

  const averageRate = totals.views > 0 
    ? ((totals.engagement / totals.views) * 100).toFixed(1)
    : '0.0';

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {campaign.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {campaign.brand && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">Brand:</span> {campaign.brand}
                </span>
              )}
              {campaign.creator && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">Creator:</span> {campaign.creator}
                </span>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
            {campaign.status}
          </span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totals.views)}</p>
            <p className="text-xs text-gray-500">Views</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totals.engagement)}</p>
            <p className="text-xs text-gray-500">Engagement</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{averageRate}%</p>
            <p className="text-xs text-gray-500">Rate</p>
          </div>
        </div>

        {/* Content URLs Info */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-500">
            {totals.urls} content URL{totals.urls !== 1 ? 's' : ''}
          </span>
          {campaign.analytics_updated_at && (
            <span className="text-gray-400">
              Updated {formatDistanceToNow(new Date(campaign.analytics_updated_at), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onAnalyticsClick(campaign.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart className="w-4 h-4" />
            Analytics
          </button>
          
          {onEdit && (
            <button
              onClick={() => onEdit(campaign)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit campaign"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          
          {onRefresh && (
            <button
              onClick={() => onRefresh(campaign.id)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(campaign.id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete campaign"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Campaign List Component
interface CampaignListProps {
  campaigns: Campaign[];
  onAnalyticsClick: (campaignId: string) => void;
  onEdit?: (campaign: Campaign) => void;
  onRefresh?: (campaignId: string) => void;
  onDelete?: (campaignId: string) => void;
  isLoading?: boolean;
}

export function CampaignList({ 
  campaigns, 
  onAnalyticsClick, 
  onEdit, 
  onRefresh, 
  onDelete,
  isLoading 
}: CampaignListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No campaigns found</p>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create Your First Campaign
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map(campaign => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onAnalyticsClick={onAnalyticsClick}
          onEdit={onEdit}
          onRefresh={onRefresh}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}