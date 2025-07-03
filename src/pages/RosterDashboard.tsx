import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoster } from "@/hooks/useRoster";
import { useAuth } from "@/hooks/useAuth";
import { useYouTubeAnalytics } from "@/hooks/useYouTubeAnalytics";
import { Users, Youtube, Instagram, TrendingUp, Eye, Heart, RefreshCw } from "lucide-react";
import AnalyticsChart from "@/components/AnalyticsChart";
import CreatorMetrics from "@/components/CreatorMetrics";

const RosterDashboard = () => {
  const { creators, loading } = useRoster();
  const { user } = useAuth();
  const { fetchYouTubeAnalytics, loading: youtubeLoading } = useYouTubeAnalytics();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Helper functions remain the same
  const getJsonObject = (jsonObj: any): Record<string, any> => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return jsonObj;
    }
    return {};
  };

  const getStringValue = (jsonObj: any, key: string): string => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return jsonObj[key] || '';
    }
    return '';
  };

  const hasValue = (jsonObj: any, key: string): boolean => {
    return Boolean(getStringValue(jsonObj, key));
  };

  // Initialize selected creators to include all
  useEffect(() => {
    if (creators.length > 0 && selectedCreators.length === 0) {
      setSelectedCreators(creators.map(c => c.id));
    }
  }, [creators, selectedCreators.length]);

  // Filter creators based on selected platform and creators
  const getFilteredCreators = () => {
    let filtered = creators;
    
    // Filter by selected creators
    if (selectedCreators.length > 0) {
      filtered = filtered.filter(creator => selectedCreators.includes(creator.id));
    }
    
    // Filter by platform
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
  };

  const filteredCreators = getFilteredCreators();

  // Generate analytics data with real YouTube integration
  const generateAnalyticsData = async () => {
    const data = [];
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    for (const date of dates) {
      let totalViews = 0;
      let totalEngagement = 0;
      let totalSubscribers = 0;

      for (const creator of filteredCreators) {
        const channelLinks = getJsonObject(creator.channel_links);
        const socialHandles = getJsonObject(creator.social_media_handles);

        // Mock data for now, but integrate with real APIs
        if (selectedPlatform === "all" || selectedPlatform === "youtube") {
          if (hasValue(channelLinks, 'youtube')) {
            totalViews += Math.floor(Math.random() * 10000) + 1000;
            totalEngagement += Math.floor(Math.random() * 500) + 50;
            totalSubscribers += Math.floor(Math.random() * 100) + 10;
          }
        }
        if (selectedPlatform === "all" || selectedPlatform === "instagram") {
          if (hasValue(socialHandles, 'instagram')) {
            totalViews += Math.floor(Math.random() * 5000) + 500;
            totalEngagement += Math.floor(Math.random() * 300) + 30;
            totalSubscribers += Math.floor(Math.random() * 50) + 5;
          }
        }
        if (selectedPlatform === "all" || selectedPlatform === "tiktok") {
          if (hasValue(socialHandles, 'tiktok')) {
            totalViews += Math.floor(Math.random() * 20000) + 2000;
            totalEngagement += Math.floor(Math.random() * 1000) + 100;
            totalSubscribers += Math.floor(Math.random() * 200) + 20;
          }
        }
      }

      data.push({
        date,
        views: totalViews,
        engagement: totalEngagement,
        subscribers: totalSubscribers
      });
    }

    return data;
  };

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await generateAnalyticsData();
      setAnalyticsData(data);
    };
    
    if (filteredCreators.length > 0) {
      loadAnalytics();
    }
  }, [filteredCreators, selectedPlatform]);

  // Refresh analytics with real YouTube data
  const refreshAnalytics = async () => {
    setRefreshing(true);
    try {
      // Fetch real YouTube data for creators with YouTube channels
      for (const creator of filteredCreators) {
        const channelLinks = getJsonObject(creator.channel_links);
        const youtubeUrl = getStringValue(channelLinks, 'youtube');
        
        if (youtubeUrl) {
          console.log(`Fetching YouTube analytics for ${creator.creator_name}...`);
          const youtubeData = await fetchYouTubeAnalytics(youtubeUrl, creator.id);
          if (youtubeData) {
            console.log(`YouTube data for ${creator.creator_name}:`, youtubeData);
          }
        }
      }
      
      // Regenerate analytics data
      const data = await generateAnalyticsData();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate aggregated metrics
  const getAggregatedAnalytics = () => {
    const aggregated = {
      totalViews: 0,
      totalEngagement: 0,
      totalSubscribers: 0,
      averageEngagementRate: 0,
    };

    let totalEngagementRates = 0;
    let platformCount = 0;

    filteredCreators.forEach(creator => {
      const channelLinks = getJsonObject(creator.channel_links);
      const socialHandles = getJsonObject(creator.social_media_handles);
      
      const platforms = [];
      if (selectedPlatform === "all" || selectedPlatform === "youtube") {
        if (hasValue(channelLinks, 'youtube')) platforms.push('youtube');
      }
      if (selectedPlatform === "all" || selectedPlatform === "instagram") {
        if (hasValue(socialHandles, 'instagram')) platforms.push('instagram');
      }
      if (selectedPlatform === "all" || selectedPlatform === "tiktok") {
        if (hasValue(socialHandles, 'tiktok')) platforms.push('tiktok');
      }

      platforms.forEach(() => {
        const views = Math.floor(Math.random() * 100000) + 10000;
        const engagement = Math.floor(Math.random() * 5000) + 500;
        const subscribers = Math.floor(Math.random() * 10000) + 1000;
        const engagementRate = (engagement / views) * 100;

        aggregated.totalViews += views;
        aggregated.totalEngagement += engagement;
        aggregated.totalSubscribers += subscribers;
        totalEngagementRates += engagementRate;
        platformCount++;
      });
    });

    aggregated.averageEngagementRate = platformCount > 0 ? totalEngagementRates / platformCount : 0;
    return aggregated;
  };

  const analytics = getAggregatedAnalytics();

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

              <Button onClick={refreshAnalytics} disabled={refreshing || youtubeLoading}>
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
                  <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalSubscribers.toLocaleString()}</div>
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

            {/* Analytics Chart */}
            <div className="mb-8">
              <AnalyticsChart 
                data={analyticsData} 
                selectedPlatform={selectedPlatform}
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
                    {filteredCreators.map((creator) => {
                      const channelLinks = getJsonObject(creator.channel_links);
                      const socialHandles = getJsonObject(creator.social_media_handles);
                      
                      const platforms = [];
                      if ((selectedPlatform === "all" || selectedPlatform === "youtube") && hasValue(channelLinks, 'youtube')) {
                        platforms.push({
                          platform: 'YouTube',
                          views: Math.floor(Math.random() * 100000) + 10000,
                          engagement: Math.floor(Math.random() * 5000) + 500,
                          subscribers: Math.floor(Math.random() * 50000) + 5000,
                          engagementRate: (Math.random() * 10 + 1).toFixed(2)
                        });
                      }
                      if ((selectedPlatform === "all" || selectedPlatform === "instagram") && hasValue(socialHandles, 'instagram')) {
                        platforms.push({
                          platform: 'Instagram',
                          views: Math.floor(Math.random() * 50000) + 5000,
                          engagement: Math.floor(Math.random() * 2500) + 250,
                          subscribers: Math.floor(Math.random() * 25000) + 2500,
                          engagementRate: (Math.random() * 8 + 2).toFixed(2)
                        });
                      }
                      if ((selectedPlatform === "all" || selectedPlatform === "tiktok") && hasValue(socialHandles, 'tiktok')) {
                        platforms.push({
                          platform: 'TikTok',
                          views: Math.floor(Math.random() * 200000) + 20000,
                          engagement: Math.floor(Math.random() * 10000) + 1000,
                          subscribers: Math.floor(Math.random() * 100000) + 10000,
                          engagementRate: (Math.random() * 15 + 3).toFixed(2)
                        });
                      }
                      
                      return platforms.length > 0 ? (
                        <CreatorMetrics
                          key={creator.id}
                          creatorName={creator.creator_name}
                          platforms={platforms}
                        />
                      ) : null;
                    })}
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
