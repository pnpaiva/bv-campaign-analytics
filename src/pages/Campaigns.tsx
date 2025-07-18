import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { CampaignList } from '../components/CampaignCard';
import { CampaignAnalyticsModal, useCampaignAnalyticsModal } from '../components/CampaignAnalyticsModal';
import { CampaignFormHandler } from '../components/CampaignFormHandler';
import { campaignAnalyticsService } from '../services/campaign-analytics';
import { toast } from 'sonner';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  
  // Analytics modal state
  const { isOpen, campaignId, openModal, closeModal } = useCampaignAnalyticsModal();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched campaigns:', data);
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    toast.info('Refreshing all campaign analytics...');
    
    try {
      // Refresh analytics for all campaigns
      const refreshPromises = campaigns.map(campaign => 
        campaignAnalyticsService.refreshCampaignAnalytics(campaign.id)
      );
      
      await Promise.all(refreshPromises);
      
      // Reload campaigns to show updated data
      await fetchCampaigns();
      
      toast.success('All analytics refreshed successfully');
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast.error('Failed to refresh some analytics');
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    // TODO: Implement edit functionality
    console.log('Edit campaign:', campaign);
    toast.info('Edit functionality coming soon');
  };

  const handleRefresh = async (campaignId: string) => {
    try {
      toast.info('Refreshing campaign analytics...');
      await campaignAnalyticsService.refreshCampaignAnalytics(campaignId);
      await fetchCampaigns();
      toast.success('Analytics refreshed successfully');
    } catch (error) {
      console.error('Error refreshing campaign:', error);
      toast.error('Failed to refresh analytics');
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchCampaigns();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and track your influencer campaigns
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <button
                onClick={handleRefreshAll}
                disabled={isRefreshingAll}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                Refresh All
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Master Campaigns Toggle (if needed) */}
        <div className="mb-6 flex justify-end">
          <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Master Campaigns
          </button>
        </div>

        {/* Campaign List */}
        <CampaignList
          campaigns={campaigns}
          onAnalyticsClick={openModal}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
          onDelete={handleDelete}
          isLoading={isLoading}
        />

        {/* Analytics Modal */}
        {campaignId && (
          <CampaignAnalyticsModal
            campaignId={campaignId}
            isOpen={isOpen}
            onClose={closeModal}
          />
        )}

        {/* Create Campaign Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-6">Create New Campaign</h2>
              
              <CampaignFormHandler onSubmit={handleCreateSuccess}>
                {({ handleSubmit, isLoading, error }) => (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      
                      // Extract form data
                      const campaignData = {
                        name: formData.get('name') as string,
                        brand: formData.get('brand') as string,
                        creator: formData.get('creator') as string,
                        status: 'active',
                        contentUrls: [
                          { url: formData.get('url1') as string },
                          { url: formData.get('url2') as string },
                          { url: formData.get('url3') as string },
                        ].filter(item => item.url),
                      };
                      
                      handleSubmit(campaignData);
                    }}
                  >
                    {error && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                        {error}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                        <input
                          type="text"
                          name="name"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Brand</label>
                        <input
                          type="text"
                          name="brand"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Creator</label>
                        <input
                          type="text"
                          name="creator"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Content URLs</label>
                        <div className="space-y-2">
                          <input
                            type="url"
                            name="url1"
                            placeholder="YouTube URL"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <input
                            type="url"
                            name="url2"
                            placeholder="Instagram URL"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <input
                            type="url"
                            name="url3"
                            placeholder="TikTok URL"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Creating...' : 'Create Campaign'}
                      </button>
                    </div>
                  </form>
                )}
              </CampaignFormHandler>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}