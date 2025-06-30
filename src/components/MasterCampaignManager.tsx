
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Trash2, Edit2 } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";

export const MasterCampaignManager = () => {
  const { campaigns, createCampaign, deleteCampaign } = useCampaigns();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [masterCampaignName, setMasterCampaignName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter to show only master campaign templates
  const masterCampaigns = campaigns.filter(campaign => 
    campaign.master_campaign_name && 
    campaign.creator_id === "00000000-0000-0000-0000-000000000000"
  );

  const handleCreateMasterCampaign = async () => {
    if (!masterCampaignName.trim() || !startDate || !endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast({
        title: "Validation Error", 
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Create a master campaign template record with the new is_master_campaign_template flag
      await createCampaign({
        brand_name: `Master Campaign: ${masterCampaignName}`,
        creator_id: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
        campaign_date: startDate,
        master_campaign_name: masterCampaignName,
        master_campaign_start_date: startDate,
        master_campaign_end_date: endDate,
        is_master_campaign_template: true, // Mark as template
      });
      
      toast({
        title: "Success",
        description: "Master campaign created successfully",
      });
      
      setMasterCampaignName("");
      setStartDate("");
      setEndDate("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating master campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create master campaign",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMasterCampaign = async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this master campaign? This will not affect linked campaigns.')) {
      await deleteCampaign(campaignId);
    }
  };

  const resetForm = () => {
    setMasterCampaignName("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Master Campaigns</h2>
          <p className="text-gray-600">Create campaign templates to organize related campaigns</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Master Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Master Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="master-name">Master Campaign Name *</Label>
                <Input
                  id="master-name"
                  value={masterCampaignName}
                  onChange={(e) => setMasterCampaignName(e.target.value)}
                  placeholder="Enter master campaign name"
                />
              </div>
              
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
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateMasterCampaign}
                  disabled={saving || !masterCampaignName.trim() || !startDate || !endDate}
                >
                  {saving ? "Creating..." : "Create Master Campaign"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {masterCampaigns.map((masterCampaign) => (
          <Card key={masterCampaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">
                    {masterCampaign.master_campaign_name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Master Campaign Template
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {masterCampaign.master_campaign_start_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {new Date(masterCampaign.master_campaign_start_date).toLocaleDateString()}
                    {masterCampaign.master_campaign_end_date && (
                      <span>
                        - {new Date(masterCampaign.master_campaign_end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteMasterCampaign(masterCampaign.id)}
                    className="px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {masterCampaigns.length === 0 && (
        <div className="text-center py-20">
          <div className="text-gray-400 mb-4">
            <Calendar className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No master campaigns found</h3>
          <p className="text-gray-500 mb-6">Create your first master campaign template to organize related campaigns</p>
          <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Your First Master Campaign
          </Button>
        </div>
      )}
    </div>
  );
};
