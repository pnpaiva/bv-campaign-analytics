
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar, Building2 } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useCreators } from "@/hooks/useCreators";
import { useClients } from "@/hooks/useClients";
import { CreatorSelect } from "@/components/CreatorSelect";
import { ClientSelect } from "@/components/ClientSelect";

export const MasterCampaignManager = () => {
  const { campaigns, createCampaign, deleteCampaign } = useCampaigns();
  const { creators } = useCreators();
  const { clients } = useClients();
  
  const [isCreating, setIsCreating] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [selectedCreator, setSelectedCreator] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [campaignDate, setCampaignDate] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter to show only master campaigns (those without master_campaign_id)
  const masterCampaigns = campaigns.filter(campaign => !campaign.master_campaign_id);

  const handleCreateMasterCampaign = async () => {
    if (!brandName || !selectedCreator || !campaignDate) {
      return;
    }
    
    setSaving(true);
    try {
      await createCampaign({
        brand_name: brandName,
        creator_id: selectedCreator,
        client_id: selectedClient || undefined,
        campaign_date: campaignDate,
        deal_value: dealValue ? parseFloat(dealValue) : undefined,
        // Don't set master_campaign_id to make this a master campaign
      });
      
      // Reset form
      setBrandName("");
      setSelectedCreator("");
      setSelectedClient("");
      setCampaignDate("");
      setDealValue("");
      setIsCreating(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMasterCampaign = async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this master campaign? This will not affect any child campaigns.')) {
      await deleteCampaign(campaignId);
    }
  };

  const getCreatorName = (creatorId: string) => {
    const creator = creators.find(c => c.id === creatorId);
    return creator?.name || 'Unknown Creator';
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Master Campaigns</CardTitle>
            <CardDescription>
              Manage master campaigns that can be used as templates for creating child campaigns
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="master-brand">Brand Name *</Label>
                <Input 
                  id="master-brand"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Enter brand name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="master-date">Campaign Date *</Label>
                <Input 
                  id="master-date"
                  type="date" 
                  value={campaignDate}
                  onChange={(e) => setCampaignDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CreatorSelect value={selectedCreator} onValueChange={setSelectedCreator} />
              <ClientSelect value={selectedClient} onValueChange={setSelectedClient} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="master-deal">Deal Value (Optional)</Label>
              <Input 
                id="master-deal"
                type="number"
                placeholder="0.00"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateMasterCampaign}
                disabled={saving || !brandName || !selectedCreator || !campaignDate}
              >
                {saving ? "Creating..." : "Create Master Campaign"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false);
                  setBrandName("");
                  setSelectedCreator("");
                  setSelectedClient("");
                  setCampaignDate("");
                  setDealValue("");
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
                <Card key={campaign.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{campaign.brand_name}</h4>
                        <p className="text-sm text-gray-600">{getCreatorName(campaign.creator_id)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMasterCampaign(campaign.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(campaign.campaign_date).toLocaleDateString()}
                      </div>

                      {campaign.client_id && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="h-3 w-3" />
                          {getClientName(campaign.client_id)}
                        </div>
                      )}

                      {campaign.deal_value && (
                        <div className="text-green-600 font-medium">
                          ${campaign.deal_value.toLocaleString()}
                        </div>
                      )}
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
