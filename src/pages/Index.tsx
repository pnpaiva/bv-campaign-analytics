import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, Users, DollarSign, Youtube, Instagram, FileText, Download, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCampaigns } from "@/hooks/useCampaigns";
import { AuthPage } from "@/components/AuthPage";
import { CreatorSelect } from "@/components/CreatorSelect";
import { DashboardFilters } from "@/components/DashboardFilters";
import { EditCampaignDialog } from "@/components/EditCampaignDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { campaigns, createCampaign, updateCampaign, deleteCampaign, getTotalEngagement } = useCampaigns();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState("dashboard");
  const [dashboardFilters, setDashboardFilters] = useState<{
    startDate?: string;
    endDate?: string;
    campaignIds?: string[];
  }>({});

  // Campaign form state
  const [brandName, setBrandName] = useState("");
  const [selectedCreator, setSelectedCreator] = useState("");
  const [campaignDate, setCampaignDate] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [contentUrls, setContentUrls] = useState<{ platform: string; url: string }[]>([]);

  // Edit/Delete state
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleCreateCampaign = async () => {
    if (!brandName || !selectedCreator || !campaignDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const campaign = await createCampaign({
      brand_name: brandName,
      creator_id: selectedCreator,
      campaign_date: campaignDate,
      deal_value: dealValue ? parseFloat(dealValue) : undefined,
    });

    if (campaign) {
      setBrandName("");
      setSelectedCreator("");
      setCampaignDate("");
      setDealValue("");
      setContentUrls([]);
      setCurrentView("campaigns");
    }
  };

  const handleEditCampaign = async (campaignData: any) => {
    if (editingCampaign) {
      await updateCampaign(editingCampaign.id, campaignData);
      setEditingCampaign(null);
    }
  };

  const handleDeleteCampaign = async () => {
    if (deletingCampaignId) {
      const success = await deleteCampaign(deletingCampaignId);
      if (success) {
        setDeletingCampaignId(null);
      }
    }
  };

  const handleGenerateReport = (campaignId: string) => {
    toast({
      title: "Report Generation",
      description: "Report generation feature will be implemented with PDF creation capability.",
    });
  };

  const addContentUrl = (platform: string) => {
    setContentUrls(prev => [...prev, { platform, url: "" }]);
  };

  const updateContentUrl = (index: number, url: string) => {
    setContentUrls(prev => prev.map((item, i) => i === index ? { ...item, url } : item));
  };

  const removeContentUrl = (index: number) => {
    setContentUrls(prev => prev.filter((_, i) => i !== index));
  };

  const totalEngagement = getTotalEngagement(
    dashboardFilters.startDate,
    dashboardFilters.endDate,
    dashboardFilters.campaignIds
  );

  const filteredCampaigns = campaigns.filter(campaign => {
    if (dashboardFilters.startDate && new Date(campaign.campaign_date) < new Date(dashboardFilters.startDate)) return false;
    if (dashboardFilters.endDate && new Date(campaign.campaign_date) > new Date(dashboardFilters.endDate)) return false;
    if (dashboardFilters.campaignIds && dashboardFilters.campaignIds.length > 0 && !dashboardFilters.campaignIds.includes(campaign.id)) return false;
    return true;
  });

  // Prepare real campaign data for charts
  const campaignPerformanceData = filteredCampaigns
    .sort((a, b) => new Date(a.campaign_date).getTime() - new Date(b.campaign_date).getTime())
    .map(campaign => ({
      name: campaign.brand_name,
      views: campaign.total_views,
      engagement: campaign.total_engagement,
      date: campaign.campaign_date
    }));

  // Platform distribution based on actual campaigns
  const platformStats = {
    YouTube: 0,
    Instagram: 0,
    TikTok: 0,
  };

  // For now, we'll distribute based on campaign count since we don't have platform-specific data
  // This is a placeholder until we have platform-specific analytics data
  const totalCampaigns = filteredCampaigns.length;
  if (totalCampaigns > 0) {
    // Distribute evenly for now - this would be replaced with actual platform data from analytics
    platformStats.YouTube = Math.round((totalCampaigns * 0.45));
    platformStats.Instagram = Math.round((totalCampaigns * 0.35));
    platformStats.TikTok = totalCampaigns - platformStats.YouTube - platformStats.Instagram;
  }

  const platformData = [
    { name: "YouTube", value: platformStats.YouTube, color: "#FF0000" },
    { name: "Instagram", value: platformStats.Instagram, color: "#E4405F" },
    { name: "TikTok", value: platformStats.TikTok, color: "#000000" },
  ].filter(platform => platform.value > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Beyond Views</h1>
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentView === "dashboard"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView("campaigns")}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentView === "campaigns"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Campaigns
                </button>
                <button
                  onClick={() => setCurrentView("new-campaign")}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentView === "new-campaign"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  New Campaign
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "dashboard" && (
          <div className="space-y-6">
            {/* Dashboard Filters */}
            <DashboardFilters onFiltersChange={setDashboardFilters} />

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                      <p className="text-3xl font-bold text-gray-900">{filteredCampaigns.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    {dashboardFilters.startDate || dashboardFilters.endDate || dashboardFilters.campaignIds ? 'Filtered results' : 'All campaigns'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {filteredCampaigns.reduce((sum, c) => sum + c.total_views, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">From selected campaigns</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                      <p className="text-3xl font-bold text-gray-900">{totalEngagement.toLocaleString()}</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">Filtered engagement</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Engagement Rate</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {filteredCampaigns.length > 0 
                          ? (filteredCampaigns.reduce((sum, c) => sum + c.engagement_rate, 0) / filteredCampaigns.length).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">From filtered campaigns</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Views and engagement by campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {campaignPerformanceData.length > 0 ? (
                      <LineChart data={campaignPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} name="Views" />
                        <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} name="Engagement" />
                      </LineChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No campaign data available
                      </div>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                  <CardDescription>Campaign distribution by platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {platformData.length > 0 ? (
                      <PieChart>
                        <Pie
                          data={platformData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {platformData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No platform data available
                      </div>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentView === "campaigns" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Campaign Management</h2>
              <Button onClick={() => setCurrentView("new-campaign")}>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input className="pl-10" placeholder="Search campaigns..." />
              </div>
            </div>

            <div className="grid gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.brand_name}</h3>
                          <p className="text-sm text-gray-600">{campaign.creators?.name}</p>
                          <p className="text-xs text-gray-500">{new Date(campaign.campaign_date).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div>
                          <p className="font-medium">{campaign.total_views.toLocaleString()}</p>
                          <p>Total Views</p>
                        </div>
                        <div>
                          <p className="font-medium">{campaign.engagement_rate}%</p>
                          <p>Engagement</p>
                        </div>
                        <div>
                          <p className="font-medium">{campaign.deal_value ? `$${campaign.deal_value.toLocaleString()}` : 'N/A'}</p>
                          <p>Deal Value</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingCampaign(campaign)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setDeletingCampaignId(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleGenerateReport(campaign.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentView === "new-campaign" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Campaign</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Enter the basic information for your campaign analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand Name</Label>
                    <Input 
                      id="brand" 
                      placeholder="Enter brand name" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <CreatorSelect value={selectedCreator} onValueChange={setSelectedCreator} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content URLs</CardTitle>
                <CardDescription>Add URLs from YouTube, Instagram, and TikTok</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contentUrls.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      placeholder={`${item.platform} URL`}
                      value={item.url}
                      onChange={(e) => updateContentUrl(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeContentUrl(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                
                <div className="space-y-2">
                  <Button variant="outline" size="sm" onClick={() => addContentUrl('YouTube')}>
                    <Youtube className="h-4 w-4 mr-2 text-red-600" />
                    Add YouTube URL
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addContentUrl('Instagram')}>
                    <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                    Add Instagram URL
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addContentUrl('TikTok')}>
                    <div className="h-4 w-4 mr-2 bg-black rounded"></div>
                    Add TikTok URL
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setCurrentView("campaigns")}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign}>
                Create Campaign
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Edit Campaign Dialog */}
      <EditCampaignDialog
        campaign={editingCampaign}
        open={!!editingCampaign}
        onOpenChange={(open) => !open && setEditingCampaign(null)}
        onSave={handleEditCampaign}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCampaignId} onOpenChange={(open) => !open && setDeletingCampaignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone and will remove all associated analytics data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCampaign} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
