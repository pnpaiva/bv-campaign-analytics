
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCampaigns } from "@/hooks/useCampaigns";

interface DashboardFiltersProps {
  onFiltersChange: (filters: {
    startDate?: string;
    endDate?: string;
    campaignIds?: string[];
  }) => void;
}

export const DashboardFilters = ({ onFiltersChange }: DashboardFiltersProps) => {
  const { campaigns } = useCampaigns();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  const handleFilterChange = () => {
    onFiltersChange({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      campaignIds: selectedCampaigns.length > 0 ? selectedCampaigns : undefined,
    });
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCampaigns([]);
    onFiltersChange({});
  };

  const toggleCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        
        <div className="space-y-2">
          <Label>Select Campaigns</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {campaigns.map((campaign) => (
              <Badge
                key={campaign.id}
                variant={selectedCampaigns.includes(campaign.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleCampaign(campaign.id)}
              >
                {campaign.brand_name} - {campaign.creators?.name}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleFilterChange}>Apply Filters</Button>
          <Button variant="outline" onClick={handleClearFilters}>Clear All</Button>
        </div>
      </CardContent>
    </Card>
  );
};
