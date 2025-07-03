
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoster } from "@/hooks/useRoster";
import { useAuth } from "@/hooks/useAuth";
import { Users, Youtube, Instagram, TrendingUp, Eye, Heart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

const RosterDashboard = () => {
  const { creators, loading } = useRoster();
  const { user } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  // Helper function to safely convert Json to object
  const getJsonObject = (jsonObj: any): Record<string, any> => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return jsonObj;
    }
    return {};
  };

  // Helper function to safely get string value from Json
  const getStringValue = (jsonObj: any, key: string): string => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return jsonObj[key] || '';
    }
    return '';
  };

  // Helper function to check if a value exists
  const hasValue = (jsonObj: any, key: string): boolean => {
    return Boolean(getStringValue(jsonObj, key));
  };

  // Filter creators based on selected platform
  const getFilteredCreators = () => {
    if (selectedPlatform === "all") return creators;
    
    return creators.filter(creator => {
      const channelLinks = getJsonObject(creator.channel_links);
      const socialHandles = getJsonObject(creator.social_media_handles);
      
      switch (selectedPlatform) {
        case "youtube":
          return hasValue(channelLinks, 'youtube');
        case "instagram":
          return hasValue(socialHandles, 'instagram');
        case "tiktok":
          return hasValue(socialHandles, 'tiktok');
        default:
          return true;
      }
    });
  };

  const filteredCreators = getFilteredCreators();

  // Mock analytics data - in real implementation, this would come from roster_analytics table
  const generateMockAnalytics = (creator: any) => {
    const channelLinks = getJsonObject(creator.channel_links);
    const socialHandles = getJsonObject(creator.social_media_handles);
    
    const analytics = [];
    
    if (hasValue(channelLinks, 'youtube')) {
      analytics.push({
        platform: 'YouTube',
        views: Math.floor(Math.random() * 1000000) + 10000,
        engagement: Math.floor(Math.random() * 50000) + 1000,
        engagementRate: (Math.random() * 10 + 1).toFixed(2)
      });
    }
    
    if (hasValue(socialHandles, 'instagram')) {
      analytics.push({
        platform: 'Instagram',
        views: Math.floor(Math.random() * 500000) + 5000,
        engagement: Math.floor(Math.random() * 25000) + 500,
        engagementRate: (Math.random() * 8 + 2).toFixed(2)
      });
    }
    
    if (hasValue(socialHandles, 'tiktok')) {
      analytics.push({
        platform: 'TikTok',
        views: Math.floor(Math.random() * 2000000) + 20000,
        engagement: Math.floor(Math.random() * 100000) + 2000,
        engagementRate: (Math.random() * 15 + 3).toFixed(2)
      });
    }
    
    return analytics;
  };

  // Aggregate analytics data
  const getAggregatedAnalytics = () => {
    const aggregated = {
      totalViews: 0,
      totalEngagement: 0,
      averageEngagementRate: 0,
      platformBreakdown: { YouTube: 0, Instagram: 0, TikTok: 0 }
    };

    let totalEngagementRates = 0;
    let platformCount = 0;

    filteredCreators.forEach(creator => {
      const analytics = generateMockAnalytics(creator);
      analytics.forEach(data => {
        if (selectedPlatform === "all" || data.platform.toLowerCase() === selectedPlatform) {
          aggregated.totalViews += data.views;
          aggregated.totalEngagement += data.engagement;
          aggregated.platformBreakdown[data.platform as keyof typeof aggregated.platformBreakdown] += data.views;
          totalEngagementRates += parseFloat(data.engagementRate);
          platformCount++;
        }
      });
    });

    aggregated.averageEngagementRate = platformCount > 0 ? totalEngagementRates / platformCount : 0;

    return aggregated;
  };

  const analytics = getAggregatedAnalytics();

  // Chart configuration
  const chartConfig = {
    views: {
      label: "Views",
    },
    engagement: {
      label: "Engagement",
    },
  };

  // Platform breakdown chart data
  const platformChartData = Object.entries(analytics.platformBreakdown)
    .filter(([_, value]) => value > 0)
    .map(([platform, views]) => ({
      platform,
      views,
      fill: platform === 'YouTube' ? '#FF0000' : platform === 'Instagram' ? '#E4405F' : '#000000'
    }));

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please sign in to view your roster dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCreators = filteredCreators.length;
  const creatorsWithYoutube = filteredCreators.filter(c => hasValue(getJsonObject(c.channel_links), 'youtube')).length;
  const creatorsWithInstagram = filteredCreators.filter(c => hasValue(getJsonObject(c.social_media_handles), 'instagram')).length;
  const creatorsWithTiktok = filteredCreators.filter(c => hasValue(getJsonObject(c.social_media_handles), 'tiktok')).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Roster Dashboard</h1>
              <p className="text-gray-600 mt-2">Overview of your creator roster and analytics</p>
            </div>
            <div className="flex gap-4">
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCreators}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">YouTube Channels</CardTitle>
                  <Youtube className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorsWithYoutube}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Instagram Accounts</CardTitle>
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorsWithInstagram}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">TikTok Accounts</CardTitle>
                  <span className="h-4 w-4 text-muted-foreground font-bold text-xs">T</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorsWithTiktok}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.averageEngagementRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPlatform === "all" ? "Across all platforms" : `On ${selectedPlatform}`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalEngagement.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPlatform === "all" ? "Across all platforms" : `On ${selectedPlatform}`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Breakdown Chart */}
            {selectedPlatform === "all" && platformChartData.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Platform Views Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={platformChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="views"
                          label={({ platform, views }) => `${platform}: ${views.toLocaleString()}`}
                        >
                          {platformChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Creator List with Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Creator Analytics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredCreators.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    {selectedPlatform === "all" 
                      ? "No creators in your roster yet. Add creators to see their analytics here."
                      : `No creators found for ${selectedPlatform}. Try selecting a different platform.`
                    }
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredCreators.map((creator) => {
                      const channelLinks = getJsonObject(creator.channel_links);
                      const socialHandles = getJsonObject(creator.social_media_handles);
                      const creatorAnalytics = generateMockAnalytics(creator);
                      
                      return (
                        <div key={creator.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">{creator.creator_name}</h3>
                            <div className="flex gap-4 text-sm text-gray-600">
                              {hasValue(channelLinks, 'youtube') && (
                                <div className="flex items-center gap-1">
                                  <Youtube className="h-3 w-3" />
                                  <span>YouTube</span>
                                </div>
                              )}
                              {hasValue(socialHandles, 'instagram') && (
                                <div className="flex items-center gap-1">
                                  <Instagram className="h-3 w-3" />
                                  <span>Instagram</span>
                                </div>
                              )}
                              {hasValue(socialHandles, 'tiktok') && (
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-xs">T</span>
                                  <span>TikTok</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {creatorAnalytics
                              .filter(data => selectedPlatform === "all" || data.platform.toLowerCase() === selectedPlatform)
                              .map((data, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded">
                                  <div className="text-sm font-medium text-gray-700">{data.platform}</div>
                                  <div className="mt-1">
                                    <div className="text-lg font-bold">{data.views.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Views</div>
                                  </div>
                                  <div className="mt-2">
                                    <div className="text-sm font-semibold">{data.engagement.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Engagement</div>
                                  </div>
                                  <div className="mt-2">
                                    <div className="text-sm font-semibold text-green-600">{data.engagementRate}%</div>
                                    <div className="text-xs text-gray-500">Engagement Rate</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Future Analytics Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Real-time Analytics Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  The analytics shown above are mock data for demonstration. To enable real-time analytics tracking, 
                  integrate with platform APIs (YouTube Data API, Instagram Basic Display API, TikTok API) to fetch 
                  actual metrics and store them in the roster_analytics table. This will provide accurate views, 
                  engagement rates, and trend analysis for each creator in your roster.
                </p>
                <Button className="mt-4" variant="outline" disabled>
                  Configure API Integration (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default RosterDashboard;
