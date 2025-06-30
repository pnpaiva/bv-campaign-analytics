
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const { campaigns } = useCampaigns();
  const { creators } = useCreators();
  const { clients } = useClients();

  const platforms = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter'];

  const handleApplyFilters = () => {
    const filters: DashboardFiltersType = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      creatorIds: selectedCreators.length > 0 ? selectedCreators : undefined,
      clientIds: selectedClients.length > 0 ? selectedClients : undefined,
      campaignIds: selectedCampaigns.length > 0 ? selectedCampaigns : undefined,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
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
    onFiltersChange({});
  };

  const toggleSelection = (value: string, currentSelection: string[], setter: (selection: string[]) => void) => {
    if (currentSelection.includes(value)) {
      setter(currentSelection.filter(item => item !== value));
    } else {
      setter([...currentSelection, value]);
    }
  };

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

        {/* Creators Filter */}
        <div className="space-y-2">
          <Label>Creators</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {creators.map((creator) => (
              <Badge
                key={creator.id}
                variant={selectedCreators.includes(creator.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSelection(creator.id, selectedCreators, setSelectedCreators)}
              >
                {creator.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Clients Filter */}
        <div className="space-y-2">
          <Label>Clients</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {clients.map((client) => (
              <Badge
                key={client.id}
                variant={selectedClients.includes(client.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSelection(client.id, selectedClients, setSelectedClients)}
              >
                {client.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Campaigns Filter */}
        <div className="space-y-2">
          <Label>Campaigns</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {campaigns.slice(0, 20).map((campaign) => (
              <Badge
                key={campaign.id}
                variant={selectedCampaigns.includes(campaign.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSelection(campaign.id, selectedCampaigns, setSelectedCampaigns)}
              >
                {campaign.brand_name} - {campaign.creators?.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Platforms Filter */}
        <div className="space-y-2">
          <Label>Platforms</Label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <Badge
                key={platform}
                variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => toggleSelection(platform, selectedPlatforms, setSelectedPlatforms)}
              >
                {platform}
              </Badge>
            ))}
          </div>
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
