
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreatorSelect } from "@/components/CreatorSelect";
import { ClientSelect } from "@/components/ClientSelect";
import { MasterCampaignSelect } from "@/components/MasterCampaignSelect";
import { Campaign } from "@/hooks/useCampaigns";
import { Youtube, Instagram, Trash2, Plus, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EditCampaignDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (campaignData: {
    brand_name?: string;
    creator_id?: string;
    campaign_date?: string;
    campaign_month?: string;
    client_id?: string;
    master_campaign_id?: string;
    deal_value?: number;
    content_urls?: { platform: string; url: string }[];
  }) => Promise<void>;
}

export const EditCampaignDialog = ({ campaign, open, onOpenChange, onSave }: EditCampaignDialogProps) => {
  const [brandName, setBrandName] = useState("");
  const [selectedCreator, setSelectedCreator] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedMasterCampaign, setSelectedMasterCampaign] = useState("");
  const [campaignDate, setCampaignDate] = useState("");
  const [campaignMonth, setCampaignMonth] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [contentUrls, setContentUrls] = useState<{ platform: string; url: string; confirmed: boolean; existing?: boolean }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingUrls, setLoadingUrls] = useState(false);

  // Fetch existing content URLs from analytics_data
  const fetchExistingUrls = async (campaignId: string) => {
    setLoadingUrls(true);
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('platform, content_url')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      const urls = data.map(item => ({
        platform: item.platform,
        url: item.content_url,
        confirmed: true,
        existing: true // Mark as existing URL
      }));
      
      setContentUrls(urls);
    } catch (error) {
      console.error('Error fetching existing URLs:', error);
      setContentUrls([]);
    } finally {
      setLoadingUrls(false);
    }
  };

  // Reset form when dialog opens with campaign data
  useEffect(() => {
    if (campaign && open) {
      setBrandName(campaign.brand_name);
      setSelectedCreator(campaign.creator_id);
      setSelectedClient(campaign.client_id || "");
      setSelectedMasterCampaign(campaign.master_campaign_name || "");
      setCampaignDate(campaign.campaign_date);
      setCampaignMonth(campaign.campaign_month || "");
      setDealValue(campaign.deal_value?.toString() || "");
      
      // Fetch existing content URLs from the database
      fetchExistingUrls(campaign.id);
    }
  }, [campaign, open]);

  const addContentUrl = (platform: string) => {
    setContentUrls(prev => [...prev, { platform, url: "", confirmed: false, existing: false }]);
  };

  const updateContentUrl = (index: number, url: string) => {
    setContentUrls(prev => prev.map((item, i) => i === index ? { ...item, url, confirmed: false } : item));
  };

  const confirmContentUrl = (index: number) => {
    const url = contentUrls[index].url.trim();
    if (!url) return;
    
    // Basic YouTube URL validation
    if (contentUrls[index].platform === 'YouTube') {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      if (!youtubeRegex.test(url)) {
        alert('Please enter a valid YouTube URL');
        return;
      }
    }
    
    setContentUrls(prev => prev.map((item, i) => i === index ? { ...item, confirmed: true } : item));
  };

  const removeContentUrl = (index: number) => {
    setContentUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!campaign) return;
    
    setSaving(true);
    try {
      const confirmedUrls = contentUrls.filter(url => url.confirmed && url.url.trim() !== '' && !url.existing);
      await onSave({
        brand_name: brandName,
        creator_id: selectedCreator,
        client_id: selectedClient || undefined,
        master_campaign_id: selectedMasterCampaign || undefined,
        campaign_date: campaignDate,
        campaign_month: campaignMonth || undefined,
        deal_value: dealValue ? parseFloat(dealValue) : undefined,
        content_urls: confirmedUrls.map(({ platform, url }) => ({ platform, url })),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const groupedUrls = contentUrls.reduce((acc, url, index) => {
    if (!acc[url.platform]) {
      acc[url.platform] = [];
    }
    acc[url.platform].push({ ...url, index });
    return acc;
  }, {} as Record<string, Array<{ platform: string; url: string; confirmed: boolean; existing?: boolean; index: number }>>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
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

          <ClientSelect value={selectedClient} onValueChange={setSelectedClient} />

          <div className="space-y-2">
            <CreatorSelect value={selectedCreator} onValueChange={setSelectedCreator} />
          </div>

          <MasterCampaignSelect 
            value={selectedMasterCampaign} 
            onValueChange={setSelectedMasterCampaign}
          />

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
            <Label htmlFor="month">Campaign Month (Optional)</Label>
            <Input 
              id="month" 
              type="month" 
              value={campaignMonth}
              onChange={(e) => setCampaignMonth(e.target.value)}
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
            {loadingUrls ? (
              <div className="text-center py-2 text-gray-500">Loading existing videos...</div>
            ) : (
              <div className="space-y-4">
                {/* YouTube URLs */}
                {groupedUrls.YouTube && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-600" />
                      <span className="font-medium">YouTube Videos</span>
                    </div>
                    {groupedUrls.YouTube.map((item) => (
                      <div key={item.index} className="flex gap-2 items-center ml-6">
                        <Input 
                          placeholder="YouTube URL"
                          value={item.url}
                          onChange={(e) => updateContentUrl(item.index, e.target.value)}
                          className={`flex-1 ${item.confirmed ? 'border-green-500 bg-green-50' : ''} ${item.existing ? 'border-blue-500 bg-blue-50' : ''}`}
                          disabled={item.confirmed || item.existing}
                        />
                        {item.existing && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(item.url, '_blank')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {!item.confirmed && !item.existing ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => confirmContentUrl(item.index)}
                            disabled={!item.url.trim()}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : !item.existing ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setContentUrls(prev => prev.map((url, i) => i === item.index ? { ...url, confirmed: false } : url))}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </Button>
                        ) : null}
                        {!item.existing && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeContentUrl(item.index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Instagram URLs */}
                {groupedUrls.Instagram && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      <span className="font-medium">Instagram Posts</span>
                    </div>
                    {groupedUrls.Instagram.map((item) => (
                      <div key={item.index} className="flex gap-2 items-center ml-6">
                        <Input 
                          placeholder="Instagram URL"
                          value={item.url}
                          onChange={(e) => updateContentUrl(item.index, e.target.value)}
                          className={`flex-1 ${item.confirmed ? 'border-green-500 bg-green-50' : ''} ${item.existing ? 'border-blue-500 bg-blue-50' : ''}`}
                          disabled={item.confirmed || item.existing}
                        />
                        {item.existing && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(item.url, '_blank')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {!item.confirmed && !item.existing ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => confirmContentUrl(item.index)}
                            disabled={!item.url.trim()}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : !item.existing ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setContentUrls(prev => prev.map((url, i) => i === item.index ? { ...url, confirmed: false } : url))}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </Button>
                        ) : null}
                        {!item.existing && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeContentUrl(item.index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* TikTok URLs */}
                {groupedUrls.TikTok && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-black rounded" />
                      <span className="font-medium">TikTok Videos</span>
                    </div>
                    {groupedUrls.TikTok.map((item) => (
                      <div key={item.index} className="flex gap-2 items-center ml-6">
                        <Input 
                          placeholder="TikTok URL"
                          value={item.url}
                          onChange={(e) => updateContentUrl(item.index, e.target.value)}
                          className={`flex-1 ${item.confirmed ? 'border-green-500 bg-green-50' : ''} ${item.existing ? 'border-blue-500 bg-blue-50' : ''}`}
                          disabled={item.confirmed || item.existing}
                        />
                        {item.existing && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(item.url, '_blank')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {!item.confirmed && !item.existing ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => confirmContentUrl(item.index)}
                            disabled={!item.url.trim()}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : !item.existing ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setContentUrls(prev => prev.map((url, i) => i === item.index ? { ...url, confirmed: false } : url))}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </Button>
                        ) : null}
                        {!item.existing && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeContentUrl(item.index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addContentUrl('YouTube')}
                    type="button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <Youtube className="h-4 w-4 mr-2 text-red-600" />
                    Add YouTube
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addContentUrl('Instagram')}
                    type="button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                    Add Instagram
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addContentUrl('TikTok')}
                    type="button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <div className="h-4 w-4 mr-2 bg-black rounded"></div>
                    Add TikTok
                  </Button>
                </div>
              </div>
            )}
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
