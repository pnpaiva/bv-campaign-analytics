
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreatorSelect } from "@/components/CreatorSelect";
import { Campaign } from "@/hooks/useCampaigns";
import { Youtube, Instagram, Trash2, Plus } from "lucide-react";

interface EditCampaignDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (campaignData: {
    brand_name?: string;
    creator_id?: string;
    campaign_date?: string;
    deal_value?: number;
    content_urls?: { platform: string; url: string }[];
  }) => Promise<void>;
}

export const EditCampaignDialog = ({ campaign, open, onOpenChange, onSave }: EditCampaignDialogProps) => {
  const [brandName, setBrandName] = useState("");
  const [selectedCreator, setSelectedCreator] = useState("");
  const [campaignDate, setCampaignDate] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [contentUrls, setContentUrls] = useState<{ platform: string; url: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens with campaign data
  useEffect(() => {
    if (campaign && open) {
      setBrandName(campaign.brand_name);
      setSelectedCreator(campaign.creator_id);
      setCampaignDate(campaign.campaign_date);
      setDealValue(campaign.deal_value?.toString() || "");
      
      // Initialize with empty content URLs array - you can extend this to load existing URLs from database if needed
      setContentUrls([]);
    }
  }, [campaign, open]);

  const addContentUrl = (platform: string) => {
    setContentUrls(prev => [...prev, { platform, url: "" }]);
  };

  const updateContentUrl = (index: number, url: string) => {
    setContentUrls(prev => prev.map((item, i) => i === index ? { ...item, url } : item));
  };

  const removeContentUrl = (index: number) => {
    setContentUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!campaign) return;
    
    setSaving(true);
    try {
      await onSave({
        brand_name: brandName,
        creator_id: selectedCreator,
        campaign_date: campaignDate,
        deal_value: dealValue ? parseFloat(dealValue) : undefined,
        content_urls: contentUrls.filter(url => url.url.trim() !== ''),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
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

          {/* Content URLs Section */}
          <div className="space-y-2">
            <Label>Content URLs</Label>
            <div className="space-y-3">
              {contentUrls.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {item.platform === 'YouTube' && <Youtube className="h-4 w-4 text-red-600 flex-shrink-0" />}
                    {item.platform === 'Instagram' && <Instagram className="h-4 w-4 text-pink-600 flex-shrink-0" />}
                    {item.platform === 'TikTok' && <div className="h-4 w-4 bg-black rounded flex-shrink-0"></div>}
                    <Input 
                      placeholder={`${item.platform} URL`}
                      value={item.url}
                      onChange={(e) => updateContentUrl(index, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeContentUrl(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addContentUrl('YouTube')}
                  type="button"
                >
                  <Youtube className="h-4 w-4 mr-2 text-red-600" />
                  Add YouTube
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addContentUrl('Instagram')}
                  type="button"
                >
                  <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                  Add Instagram
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addContentUrl('TikTok')}
                  type="button"
                >
                  <div className="h-4 w-4 mr-2 bg-black rounded"></div>
                  Add TikTok
                </Button>
              </div>
            </div>
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
