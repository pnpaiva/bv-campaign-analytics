
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
}

export const MasterCampaignSelect = ({ value, onValueChange }: MasterCampaignSelectProps) => {
  const [open, setOpen] = useState(false);
  const { campaigns, loading } = useCampaigns();

  // Get unique master campaign names
  const masterCampaignNames = campaigns
    .filter(campaign => campaign.master_campaign_name)
    .reduce((acc, campaign) => {
      if (!acc.includes(campaign.master_campaign_name!)) {
        acc.push(campaign.master_campaign_name!);
      }
      return acc;
    }, [] as string[]);

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
            {value || "Select master campaign..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search master campaigns..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading..." : "No master campaigns found."}
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
                {masterCampaignNames.map((name) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => {
                      onValueChange(name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {name}
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
