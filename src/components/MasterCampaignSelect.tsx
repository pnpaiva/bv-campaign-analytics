
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";

interface MasterCampaignSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export const MasterCampaignSelect = ({ value, onValueChange }: MasterCampaignSelectProps) => {
  const { campaigns, createCampaign } = useCampaigns();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMasterCampaignName, setNewMasterCampaignName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Get unique master campaign names from existing campaigns
  const masterCampaignNames = [...new Set(
    campaigns
      .filter(campaign => campaign.master_campaign_name)
      .map(campaign => campaign.master_campaign_name)
  )].filter(Boolean);

  const handleCreateMasterCampaign = async () => {
    if (!newMasterCampaignName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a master campaign name",
        variant: "destructive",
      });
      return;
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      toast({
        title: "Validation Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Create a master campaign template record if dates are provided
      if (startDate && endDate) {
        await createCampaign({
          brand_name: `Master Campaign: ${newMasterCampaignName.trim()}`,
          creator_id: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
          campaign_date: startDate,
          master_campaign_name: newMasterCampaignName.trim(),
          master_campaign_start_date: startDate,
          master_campaign_end_date: endDate,
        });
      }
      
      // Set the name to the current selection
      onValueChange(newMasterCampaignName.trim());
      setNewMasterCampaignName("");
      setStartDate("");
      setEndDate("");
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: startDate && endDate ? "Master campaign created successfully" : "Master campaign name ready to use",
      });
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

  return (
    <div className="space-y-2">
      <Label>Master Campaign (Optional)</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select or create a master campaign" />
          </SelectTrigger>
          <SelectContent>
            {masterCampaignNames.length === 0 ? (
              <SelectItem value="no-master-campaigns" disabled>No master campaigns found</SelectItem>
            ) : (
              masterCampaignNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Master Campaign</DialogTitle>
              <DialogDescription>
                Create a master campaign name to organize related campaigns. Dates are optional.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="master-campaign-name">Master Campaign Name *</Label>
                <Input
                  id="master-campaign-name"
                  value={newMasterCampaignName}
                  onChange={(e) => setNewMasterCampaignName(e.target.value)}
                  placeholder="Enter master campaign name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start-date-select">Start Date (Optional)</Label>
                <Input
                  id="start-date-select"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date-select">End Date (Optional)</Label>
                <Input
                  id="end-date-select"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNewMasterCampaignName("");
                    setStartDate("");
                    setEndDate("");
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateMasterCampaign}
                  disabled={saving || !newMasterCampaignName.trim()}
                >
                  {saving ? "Creating..." : "Create Master Campaign"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
