import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { CampaignList } from '../components/CampaignCard';
import { CampaignAnalyticsModal, useCampaignAnalyticsModal } from '../components/CampaignAnalyticsModal';
import { toast } from 'sonner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
      
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (campaign) => {
    // Navigate to edit page or open edit modal
    console.log('Edit campaign:', campaign);
  };

  const handleRefresh = async (campaignId) => {
    toast.info('Refreshing analytics...');
    // The analytics modal will handle the refresh when opened
    openModal(campaignId);
  };

  const handleDelete = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast.success('Campaign deleted successfully');
      fetchCampaigns(); // Refresh the list
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="mt-2 text-gray-600">
                Manage and track your influencer campaigns
              </p>
            </div>
            <button
              onClick={() => console.log('Create new campaign')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Campaign
            </button>
          </div>
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
      </div>
    </div>
  );
}