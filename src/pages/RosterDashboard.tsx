import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoster } from "@/hooks/useRoster";
import { useAuth } from "@/hooks/useAuth";
import { useRosterAnalytics } from "@/hooks/useRosterAnalytics";
import { Users, Youtube, Instagram, TrendingUp, Eye, Heart, RefreshCw } from "lucide-react";
import AnalyticsChart from "@/components/AnalyticsChart";
import CreatorMetrics from "@/components/CreatorMetrics";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";

const RosterDashboard = () => {
  const { creators, loading } = useRoster();
  const { user } = useAuth();
  const { analyticsData, loading: analyticsLoading, fetchRosterAnalytics, refreshAnalyticsData } = useRosterAnalytics();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [refreshing, setRefreshing] = useState(false);

  // Helper functions remain the same
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

  // Initialize selected creators to include all
  useEffect(() => {
    if (creators.length > 0 && selectedCreators.length === 0) {
      setSelectedCreators(creators.map(c => c.id));
    }
  }, [creators, selectedCreators.length]);

  // Memoize filtered creators
  const filteredCreators = useMemo(() => {
    let filtered = creators;
    
    if (selectedCreators.length > 0) {
      filtered = filtered.filter(creator => selectedCreators.includes(creator.id));
    }
    
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
  }, [creators, selectedCreators, selectedPlatform, getJsonObject, hasValue]);

  // Fetch analytics data when filters change
  useEffect(() => {
    if (filteredCreators.length > 0) {
      fetchRosterAnalytics(
        filteredCreators.map(c => c.id),
        dateRange,
        selectedPlatform === "all" ? undefined : selectedPlatform
      );
    }
  }, [filteredCreators, dateRange, selectedPlatform, fetchRosterAnalytics]);

  // Refresh analytics with real YouTube data
  const handleRefreshAnalytics = async () => {
    if (filteredCreators.length === 0) return;
    
    setRefreshing(true);
    try {
      await refreshAnalyticsData(filteredCreators.map(c => c.id));
      
      // Refetch the processed data
      await fetchRosterAnalytics(
        filteredCreators.map(c => c.id),
        dateRange,
        selectedPlatform === "all" ? undefined : selectedPlatform
      );
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate aggregated metrics from real data
  const aggregatedAnalytics = useMemo(() => {
    if (analyticsData.length === 0) {
      return {
        totalViews: 0,
        totalEngagement: 0,
        totalSubscribers: 0,
        averageEngagementRate: 0,
      };
    }

    const totals = analyticsData.reduce((acc, item) => ({
      totalViews: acc.totalViews + item.views,
      totalEngagement: acc.totalEngagement + item.engagement,
      totalSubscribers: acc.totalSubscribers + item.subscribers,
    }), { totalViews: 0, totalEngagement: 0, totalSubscribers: 0 });

    const averageEngagementRate = totals.totalViews > 0 
      ? (totals.totalEngagement / totals.totalViews) * 100 
      : 0;

    return {
      ...totals,
      averageEngagementRate
    };
  }, [analyticsData]);

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
              
              <Select 
                value={selectedCreators.length === creators.length ? "all" : "custom"} 
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedCreators(creators.map(c => c.id));
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by creators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators ({creators.length})</SelectItem>
                  {creators.map(creator => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.creator_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleRefreshAnalytics} disabled={refreshing || analyticsLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedAnalytics.totalViews.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedAnalytics.averageEngagementRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Chart */}
            <div className="mb-8">
              <AnalyticsChart 
                data={analyticsData} 
                selectedPlatform={selectedPlatform}
                loading={analyticsLoading}
              />
            </div>

            {/* Creator Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Creator Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredCreators.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    {selectedPlatform === "all" 
                      ? "No creators selected. Please select creators to view their performance."
                      : `No creators found for ${selectedPlatform}. Try selecting a different platform or creators.`
                    }
                  </p>
                ) : (
                  <div className="space-y-6">
                    {analyticsLoading ? (
                      <div className="text-center py-8">Loading analytics data...</div>
                    ) : (
                      filteredCreators.map((creator) => {
                        const channelLinks = getJsonObject(creator.channel_links);
                        const socialHandles = getJsonObject(creator.social_media_handles);
                        
                        const platforms = [];
                        if ((selectedPlatform === "all" || selectedPlatform === "youtube") && hasValue(channelLinks, 'youtube')) {
                          // Use real data from analytics if available
                          const creatorData = analyticsData.reduce((acc, item) => ({
                            views: acc.views + item.views,
                            engagement: acc.engagement + item.engagement,
                            subscribers: Math.max(acc.subscribers, item.subscribers) // Take the latest subscriber count
                          }), { views: 0, engagement: 0, subscribers: 0 });

                          platforms.push({
                            platform: 'YouTube',
                            views: creatorData.views || 0,
                            engagement: creatorData.engagement || 0,
                            subscribers: creatorData.subscribers || 0,
                            engagementRate: creatorData.views > 0 ? ((creatorData.engagement / creatorData.views) * 100).toFixed(2) : "0.00"
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
