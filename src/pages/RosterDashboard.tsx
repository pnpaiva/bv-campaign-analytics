
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useRoster } from "@/hooks/useRoster";
import { useAuth } from "@/hooks/useAuth";
import { useVideoAnalytics } from "@/hooks/useVideoAnalytics";
import { useToast } from "@/hooks/use-toast";
import { Users, Youtube, Instagram, TrendingUp, Eye, Heart, RefreshCw } from "lucide-react";
import AnalyticsChart from "@/components/AnalyticsChart";
import CreatorMetrics from "@/components/CreatorMetrics";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import RosterAnalyticsTable from "@/components/RosterAnalyticsTable";

const RosterDashboard = () => {
  const { creators, loading } = useRoster();
  const { user } = useAuth();
  const { analyticsData, creatorAnalyticsData, loading: analyticsLoading, fetchVideoAnalytics, refreshVideoAnalytics } = useVideoAnalytics();
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [refreshing, setRefreshing] = useState(false);

  // Helper functions
  const getJsonObject = useCallback((jsonObj: any): Record<string, any> => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return jsonObj;
    }
    return {};
  }, []);

  const getStringValue = useCallback((jsonObj: any, key: string): string => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return jsonObj[key] || '';
    }
    return '';
  }, []);

  const hasValue = useCallback((jsonObj: any, key: string): boolean => {
    return Boolean(getStringValue(jsonObj, key));
  }, [getStringValue]);

  // Initialize selected creators when creators load
  useEffect(() => {
    if (creators.length > 0 && selectedCreatorIds.length === 0) {
      setSelectedCreatorIds(creators.map(c => c.id));
    }
  }, [creators, selectedCreatorIds.length]);

  // Filter creators by platform
  const filteredCreators = useMemo(() => {
    let filtered = creators;
    
    if (selectedPlatform !== "all") {
      filtered = filtered.filter(creator => {
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
    }
    
    return filtered;
  }, [creators, selectedPlatform, getJsonObject, hasValue]);

  // Get currently selected creators (intersection of filtered and selected)
  const activeCreators = useMemo(() => {
    return filteredCreators.filter(creator => selectedCreatorIds.includes(creator.id));
  }, [filteredCreators, selectedCreatorIds]);

  // Fetch video analytics data when active creators or filters change
  useEffect(() => {
    if (activeCreators.length > 0) {
      console.log('Fetching video analytics for active creators:', activeCreators.map(c => ({ id: c.id, name: c.creator_name })));
      fetchVideoAnalytics(
        activeCreators.map(c => c.id),
        dateRange,
        selectedPlatform === "all" ? undefined : selectedPlatform
      );
    } else {
      console.log('No active creators selected, clearing analytics data');
      // Clear data when no creators are selected
    }
  }, [activeCreators, dateRange, selectedPlatform, fetchVideoAnalytics]);

  // Handle creator selection toggle
  const handleCreatorToggle = (creatorId: string, checked: boolean) => {
    setSelectedCreatorIds(prev => {
      if (checked) {
        return [...prev, creatorId];
      } else {
        return prev.filter(id => id !== creatorId);
      }
    });
  };

  // Handle select all/none
  const handleSelectAll = () => {
    setSelectedCreatorIds(filteredCreators.map(c => c.id));
  };

  const handleSelectNone = () => {
    setSelectedCreatorIds([]);
  };

  // Refresh video analytics with real YouTube data
  const handleRefreshAnalytics = async () => {
    if (activeCreators.length === 0) {
      toast({
        title: "No Creators Selected",
        description: "Please select creators to refresh their analytics data",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Refreshing video analytics for active creators:', activeCreators.map(c => ({ id: c.id, name: c.creator_name })));
    
    setRefreshing(true);
    try {
      await refreshVideoAnalytics(activeCreators.map(c => c.id));
      
      // Wait a moment then refetch the data
      setTimeout(() => {
        fetchVideoAnalytics(
          activeCreators.map(c => c.id),
          dateRange,
          selectedPlatform === "all" ? undefined : selectedPlatform
        );
      }, 2000);
    } catch (error) {
      console.error('Error refreshing video analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Get aggregated metrics from video analytics data
  const aggregatedAnalytics = useMemo(() => {
    if (analyticsData.length === 0) {
      return {
        totalViews: 0,
        totalEngagement: 0,
        totalSubscribers: 0,
        averageEngagementRate: 0,
      };
    }

    // Use daily values from video analytics
    const totalViews = analyticsData.reduce((sum, item) => sum + (item.daily_views || 0), 0);
    const totalEngagement = analyticsData.reduce((sum, item) => sum + (item.daily_engagement || 0), 0);
    const averageEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    // Get current total subscribers from latest data across all creators
    const latestDate = analyticsData[analyticsData.length - 1]?.date;
    const totalSubscribers = latestDate ? 
      creatorAnalyticsData
        .filter(item => item.date === latestDate)
        .reduce((sum, item) => sum + item.subscribers, 0) : 0;

    return {
      totalViews,
      totalEngagement,
      totalSubscribers,
      averageEngagementRate
    };
  }, [analyticsData, creatorAnalyticsData]);

  // Get individual creator metrics using video analytics
  const getCreatorMetrics = useCallback((creatorId: string) => {
    const creatorData = creatorAnalyticsData.filter(d => d.creator_id === creatorId);
    if (creatorData.length === 0) return null;

    const latestData = creatorData[creatorData.length - 1];
    const totalViews = creatorData.reduce((sum, item) => sum + (item.daily_views || 0), 0);
    const totalEngagement = creatorData.reduce((sum, item) => sum + (item.daily_engagement || 0), 0);
    
    return {
      views: totalViews,
      engagement: totalEngagement,
      subscribers: latestData?.subscribers || 0,
      engagementRate: totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(2) : "0.00"
    };
  }, [creatorAnalyticsData]);

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

  const totalCreators = activeCreators.length;
  const creatorsWithYoutube = activeCreators.filter(c => hasValue(getJsonObject(c.channel_links), 'youtube')).length;
  const creatorsWithInstagram = activeCreators.filter(c => hasValue(getJsonObject(c.social_media_handles), 'instagram')).length;
  const creatorsWithTiktok = activeCreators.filter(c => hasValue(getJsonObject(c.social_media_handles), 'tiktok')).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Roster Dashboard</h1>
              <p className="text-gray-600 mt-2">Overview of your creator roster and video analytics</p>
              <p className="text-sm text-gray-500 mt-1">
                Showing daily video performance for {totalCreators} creator{totalCreators !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
              
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

              <Button onClick={handleRefreshAnalytics} disabled={refreshing || analyticsLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Video Data
              </Button>
            </div>
          </div>
        </div>

        {/* Creator Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Creator Filter</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>Select All</Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone}>Select None</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCreators.map((creator) => (
                <div key={creator.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={creator.id}
                    checked={selectedCreatorIds.includes(creator.id)}
                    onCheckedChange={(checked) => handleCreatorToggle(creator.id, checked as boolean)}
                  />
                  <label htmlFor={creator.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {creator.creator_name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
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
                  <CardTitle className="text-sm font-medium">Daily Video Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedAnalytics.totalViews.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Video Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedAnalytics.averageEngagementRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Roster Analytics Table */}
            <div className="mb-8">
              <RosterAnalyticsTable
                data={analyticsData}
                creatorData={creatorAnalyticsData}
                loading={analyticsLoading}
              />
            </div>

            {/* Channel Growth Trends Chart */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Video Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsChart 
                    data={analyticsData} 
                    selectedPlatform={selectedPlatform}
                    loading={analyticsLoading}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Creator Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Creator Video Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {activeCreators.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    No creators selected. Please select creators from the filter above.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {analyticsLoading ? (
                      <div className="text-center py-8">Loading video analytics data...</div>
                    ) : (
                      activeCreators.map((creator) => {
                        const channelLinks = getJsonObject(creator.channel_links);
                        const socialHandles = getJsonObject(creator.social_media_handles);
                        const metrics = getCreatorMetrics(creator.id);
                        
                        const platforms = [];
                        if ((selectedPlatform === "all" || selectedPlatform === "youtube") && hasValue(channelLinks, 'youtube') && metrics) {
                          platforms.push({
                            platform: 'YouTube',
                            views: metrics.views,
                            engagement: metrics.engagement,
                            subscribers: metrics.subscribers,
                            engagementRate: metrics.engagementRate
                          });
                        }
                        if ((selectedPlatform === "all" || selectedPlatform === "instagram") && hasValue(socialHandles, 'instagram')) {
                          platforms.push({
                            platform: 'Instagram',
                            views: 0,
                            engagement: 0,
                            subscribers: 0,
                            engagementRate: "0.00"
                          });
                        }
                        if ((selectedPlatform === "all" || selectedPlatform === "tiktok") && hasValue(socialHandles, 'tiktok')) {
                          platforms.push({
                            platform: 'TikTok',
                            views: 0,
                            engagement: 0,
                            subscribers: 0,
                            engagementRate: "0.00"
                          });
                        }
                        
                        return platforms.length > 0 ? (
                          <CreatorMetrics
                            key={creator.id}
                            creatorName={creator.creator_name}
                            platforms={platforms}
                          />
                        ) : null;
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default RosterDashboard;
