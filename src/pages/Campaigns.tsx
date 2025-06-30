
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, MessageSquare, TrendingUp, Calendar, Building2, Link2 } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { CreateCampaignDialog } from "@/components/CreateCampaignDialog";
import { EditCampaignDialog } from "@/components/EditCampaignDialog";
import { CampaignDetailDialog } from "@/components/CampaignDetailDialog";
import { DashboardFilters } from "@/components/DashboardFilters";

export default function Campaigns() {
  const { campaigns, loading, createCampaign, updateCampaign, deleteCampaign, triggerCampaignAnalytics } = useCampaigns();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filteredCampaigns, setFilteredCampaigns] = useState(campaigns);

  const handleCreateCampaign = async (campaignData) => {
    await createCampaign(campaignData);
  };

  const handleUpdateCampaign = async (campaignData) => {
    if (selectedCampaign) {
      await updateCampaign(selectedCampaign.id, campaignData);
    }
  };

  const handleEditClick = (campaign, e) => {
    e.stopPropagation();
    setSelectedCampaign(campaign);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = async (campaign, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this campaign?')) {
      await deleteCampaign(campaign.id);
    }
  };

  const handleRefreshAnalytics = async (campaign, e) => {
    e.stopPropagation();
    await triggerCampaignAnalytics(campaign.id);
  };

  const handleCardClick = (campaign) => {
    setSelectedCampaign(campaign);
    setDetailDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'analyzing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Campaigns</h1>
            <p className="text-gray-600">Manage and track your influencer campaigns</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Campaign
          </Button>
        </div>

        <div className="mb-6">
          <DashboardFilters 
            campaigns={campaigns}
            onFilteredCampaignsChange={setFilteredCampaigns}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card 
              key={campaign.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardClick(campaign)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{campaign.brand_name}</CardTitle>
                    <CardDescription className="text-sm">
                      {campaign.creators?.name}
                    </CardDescription>
                    {campaign.clients?.name && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Building2 className="h-3 w-3" />
                        {campaign.clients.name}
                      </div>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {new Date(campaign.campaign_date).toLocaleDateString()}
                    {campaign.campaign_month && (
                      <span className="text-xs">
                        (Month: {new Date(campaign.campaign_month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })})
                      </span>
                    )}
                  </div>

                  {campaign.master_campaign_id && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Link2 className="h-3 w-3" />
                      Part of master campaign
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 py-3 border-y">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Eye className="h-4 w-4" />
                      </div>
                      <div className="text-lg font-semibold">
                        {campaign.total_views?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="text-lg font-semibold">
                        {campaign.total_engagement?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="text-lg font-semibold">
                        {campaign.engagement_rate?.toFixed(1) || '0'}%
                      </div>
                      <div className="text-xs text-gray-500">Rate</div>
                    </div>
                  </div>

                  {campaign.deal_value && (
                    <div className="text-center py-2">
                      <div className="text-lg font-semibold text-green-600">
                        ${campaign.deal_value.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Deal Value</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEditClick(campaign, e)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleRefreshAnalytics(campaign, e)}
                      className="flex-1"
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDeleteClick(campaign, e)}
                      className="px-3"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No campaigns found</h3>
            <p className="text-gray-500 mb-6">Create your first campaign to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Campaign
            </Button>
          </div>
        )}

        <CreateCampaignDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSave={handleCreateCampaign}
        />

        <EditCampaignDialog
          campaign={selectedCampaign}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleUpdateCampaign}
        />

        <CampaignDetailDialog
          campaign={selectedCampaign}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onEdit={(campaign) => {
            setDetailDialogOpen(false);
            setSelectedCampaign(campaign);
            setEditDialogOpen(true);
          }}
          onDelete={async (campaign) => {
            if (confirm('Are you sure you want to delete this campaign?')) {
              await deleteCampaign(campaign.id);
              setDetailDialogOpen(false);
            }
          }}
          onRefreshAnalytics={async (campaign) => {
            await triggerCampaignAnalytics(campaign.id);
          }}
        />
      </div>
    </div>
  );
}
