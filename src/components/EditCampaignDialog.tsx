
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreatorSelect } from "@/components/CreatorSelect";
import { Campaign } from "@/hooks/useCampaigns";

interface EditCampaignDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (campaignData: {
    brand_name?: string;
    creator_id?: string;
    campaign_date?: string;
    deal_value?: number;
  }) => Promise<void>;
}

export const EditCampaignDialog = ({ campaign, open, onOpenChange, onSave }: EditCampaignDialogProps) => {
  const [brandName, setBrandName] = useState("");
  const [selectedCreator, setSelectedCreator] = useState("");
  const [campaignDate, setCampaignDate] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens with campaign data
  useState(() => {
    if (campaign && open) {
      setBrandName(campaign.brand_name);
      setSelectedCreator(campaign.creator_id);
      setCampaignDate(campaign.campaign_date);
      setDealValue(campaign.deal_value?.toString() || "");
    }
  });

  const handleSave = async () => {
    if (!campaign) return;
    
    setSaving(true);
    try {
      await onSave({
        brand_name: brandName,
        creator_id: selectedCreator,
        campaign_date: campaignDate,
        deal_value: dealValue ? parseFloat(dealValue) : undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand Name</Label>
            <Input 
              id="brand" 
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <CreatorSelect value={selectedCreator} onValueChange={setSelectedCreator} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Campaign Date</Label>
            <Input 
              id="date" 
              type="date" 
              value={campaignDate}
              onChange={(e) => setCampaignDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal">Deal Value (Optional)</Label>
            <Input 
              id="deal" 
              placeholder="0.00" 
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
