
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCampaigns } from "@/hooks/useCampaigns";

interface MasterCampaignSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  currentCampaignId?: string;
}

export const MasterCampaignSelect = ({ value, onValueChange, currentCampaignId }: MasterCampaignSelectProps) => {
  const [open, setOpen] = useState(false);
  const { campaigns, loading } = useCampaigns();

  // Filter out the current campaign and only show campaigns that are not already children of other campaigns
  const availableMasterCampaigns = campaigns.filter(campaign => 
    campaign.id !== currentCampaignId && 
    !campaign.master_campaign_id
  );

  const selectedCampaign = campaigns.find(campaign => campaign.id === value);

  return (
    <div className="space-y-2">
      <Label>Master Campaign (Optional)</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCampaign ? `${selectedCampaign.brand_name} - ${selectedCampaign.campaign_date}` : "Select master campaign..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search campaigns..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading..." : "No campaigns found."}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value=""
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  None (standalone campaign)
                </CommandItem>
                {availableMasterCampaigns.map((campaign) => (
                  <CommandItem
                    key={campaign.id}
                    value={`${campaign.brand_name} - ${campaign.campaign_date}`}
                    onSelect={() => {
                      onValueChange(campaign.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === campaign.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {campaign.brand_name} - {campaign.campaign_date}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
