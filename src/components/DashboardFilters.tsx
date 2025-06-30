
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, X } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useCreators } from "@/hooks/useCreators";
import { useClients } from "@/hooks/useClients";
import { DashboardFilters as DashboardFiltersType } from "@/hooks/useDashboardAnalytics";

interface DashboardFiltersProps {
  onFiltersChange: (filters: DashboardFiltersType) => void;
  loading?: boolean;
}

export const DashboardFilters = ({ onFiltersChange, loading }: DashboardFiltersProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedMasterCampaigns, setSelectedMasterCampaigns] = useState<string[]>([]);

  const { campaigns } = useCampaigns();
  const { creators } = useCreators();
  const { clients } = useClients();

  const platforms = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter'];

  // Get unique master campaign names from existing campaigns
  const masterCampaigns = [...new Set(
    campaigns
      .filter(campaign => campaign.master_campaign_name)
      .map(campaign => campaign.master_campaign_name)
  )].filter(Boolean).map(name => ({ name, id: name }));

  const handleApplyFilters = () => {
    const filters: DashboardFiltersType = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      creatorIds: selectedCreators.length > 0 ? selectedCreators : undefined,
      clientIds: selectedClients.length > 0 ? selectedClients : undefined,
      campaignIds: selectedCampaigns.length > 0 ? selectedCampaigns : undefined,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      masterCampaigns: selectedMasterCampaigns.length > 0 ? selectedMasterCampaigns : undefined,
    };
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCreators([]);
    setSelectedClients([]);
    setSelectedCampaigns([]);
    setSelectedPlatforms([]);
    setSelectedMasterCampaigns([]);
    onFiltersChange({});
  };

  const toggleSelection = (value: string, currentSelection: string[], setter: (selection: string[]) => void) => {
    if (currentSelection.includes(value)) {
      setter(currentSelection.filter(item => item !== value));
    } else {
      setter([...currentSelection, value]);
    }
  };

  const removeSelectedItem = (value: string, currentSelection: string[], setter: (selection: string[]) => void) => {
    setter(currentSelection.filter(item => item !== value));
  };

  const MultiSelectDropdown = ({ 
    label, 
    items, 
    selectedItems, 
    onToggle, 
    getItemLabel,
    getItemValue 
  }: {
    label: string;
    items: any[];
    selectedItems: string[];
    onToggle: (value: string) => void;
    getItemLabel: (item: any) => string;
    getItemValue: (item: any) => string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedItems.length > 0 ? `${selectedItems.length} selected` : `Select ${label.toLowerCase()}`}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full max-h-64 overflow-y-auto">
          {items.map((item) => (
            <DropdownMenuCheckboxItem
              key={getItemValue(item)}
              checked={selectedItems.includes(getItemValue(item))}
              onCheckedChange={() => onToggle(getItemValue(item))}
            >
              {getItemLabel(item)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Show selected items as badges */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {selectedItems.map((selectedId) => {
            const item = items.find(i => getItemValue(i) === selectedId);
            return (
              <Badge key={selectedId} variant="secondary" className="gap-1">
                {item ? getItemLabel(item) : selectedId}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeSelectedItem(selectedId, selectedItems, 
                    label === 'Creators' ? setSelectedCreators :
                    label === 'Clients' ? setSelectedClients :
                    label === 'Campaigns' ? setSelectedCampaigns :
                    label === 'Platforms' ? setSelectedPlatforms :
                    setSelectedMasterCampaigns
                  )}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Dashboard Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Multi-select dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiSelectDropdown
            label="Creators"
            items={creators}
            selectedItems={selectedCreators}
            onToggle={(value) => toggleSelection(value, selectedCreators, setSelectedCreators)}
            getItemLabel={(creator) => creator.name}
            getItemValue={(creator) => creator.id}
          />

          <MultiSelectDropdown
            label="Clients"
            items={clients}
            selectedItems={selectedClients}
            onToggle={(value) => toggleSelection(value, selectedClients, setSelectedClients)}
            getItemLabel={(client) => client.name}
            getItemValue={(client) => client.id}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiSelectDropdown
            label="Campaigns"
            items={campaigns.slice(0, 50)} // Limit to prevent performance issues
            selectedItems={selectedCampaigns}
            onToggle={(value) => toggleSelection(value, selectedCampaigns, setSelectedCampaigns)}
            getItemLabel={(campaign) => `${campaign.brand_name} - ${campaign.creators?.name}`}
            getItemValue={(campaign) => campaign.id}
          />

          <MultiSelectDropdown
            label="Platforms"
            items={platforms.map(p => ({ name: p, id: p }))}
            selectedItems={selectedPlatforms}
            onToggle={(value) => toggleSelection(value, selectedPlatforms, setSelectedPlatforms)}
            getItemLabel={(platform) => platform.name.charAt(0).toUpperCase() + platform.name.slice(1)}
            getItemValue={(platform) => platform.id}
          />
        </div>

        {/* Master Campaigns Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiSelectDropdown
            label="Master Campaigns"
            items={masterCampaigns}
            selectedItems={selectedMasterCampaigns}
            onToggle={(value) => toggleSelection(value, selectedMasterCampaigns, setSelectedMasterCampaigns)}
            getItemLabel={(masterCampaign) => masterCampaign.name}
            getItemValue={(masterCampaign) => masterCampaign.id}
          />
          <div></div> {/* Empty div to maintain grid layout */}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button onClick={handleApplyFilters} disabled={loading}>
            Apply Filters
          </Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
