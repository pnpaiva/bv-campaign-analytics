
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";

export const MasterCampaignManager = () => {
  const { campaigns, createCampaign, deleteCampaign } = useCampaigns();
  
  const [isCreating, setIsCreating] = useState(false);
  const [masterName, setMasterName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Get unique master campaigns by filtering for unique master_campaign_name values
  const masterCampaigns = campaigns
    .filter(campaign => campaign.master_campaign_name)
    .reduce((acc, campaign) => {
      const existing = acc.find(c => c.master_campaign_name === campaign.master_campaign_name);
      if (!existing) {
        acc.push(campaign);
      }
      return acc;
    }, [] as typeof campaigns);

  const handleCreateMasterCampaign = async () => {
    if (!masterName || !startDate || !endDate) {
      return;
    }
    
    setSaving(true);
    try {
      // Create a master campaign record with just the name and duration
      await createCampaign({
        brand_name: `Master: ${masterName}`,
        creator_id: "00000000-0000-0000-0000-000000000000", // placeholder
        campaign_date: startDate,
        master_campaign_name: masterName,
        master_campaign_start_date: startDate,
        master_campaign_end_date: endDate,
      });
      
      // Reset form
      setMasterName("");
      setStartDate("");
      setEndDate("");
      setIsCreating(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMasterCampaign = async (campaign: any) => {
    if (confirm(`Are you sure you want to delete the master campaign "${campaign.master_campaign_name}"? This will not affect linked campaigns.`)) {
      await deleteCampaign(campaign.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Master Campaigns</CardTitle>
            <CardDescription>
              Create master campaign templates with names and durations that can be linked to individual campaigns
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsCreating(true)} 
            className="gap-2"
            disabled={isCreating}
          >
            <Plus className="h-4 w-4" />
            Add Master Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Create new master campaign form */}
        {isCreating && (
          <div className="border rounded-lg p-4 mb-6 space-y-4 bg-gray-50">
            <h3 className="font-semibold">Create New Master Campaign</h3>
            
            <div className="space-y-2">
              <Label htmlFor="master-name">Master Campaign Name *</Label>
              <Input 
                id="master-name"
                value={masterName}
                onChange={(e) => setMasterName(e.target.value)}
                placeholder="Enter master campaign name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input 
                  id="start-date"
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input 
                  id="end-date"
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateMasterCampaign}
                disabled={saving || !masterName || !startDate || !endDate}
              >
                {saving ? "Creating..." : "Create Master Campaign"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false);
                  setMasterName("");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* List of existing master campaigns */}
        <div className="space-y-4">
          {masterCampaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No master campaigns created yet</p>
              <p className="text-sm">Create your first master campaign to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masterCampaigns.map((campaign) => (
                <Card key={campaign.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{campaign.master_campaign_name}</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMasterCampaign(campaign)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        Start: {new Date(campaign.master_campaign_start_date || campaign.campaign_date).toLocaleDateString()}
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-3 w-3" />
                        End: {new Date(campaign.master_campaign_end_date || campaign.campaign_date).toLocaleDateString()}
                      </div>

                      <div className="text-blue-600 font-medium text-xs">
                        Duration: {Math.ceil((new Date(campaign.master_campaign_end_date || campaign.campaign_date).getTime() - new Date(campaign.master_campaign_start_date || campaign.campaign_date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Badge variant="secondary" className="text-xs">
                        Master Campaign
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
