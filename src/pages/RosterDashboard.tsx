import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useRoster } from "@/hooks/useRoster";
import { useAuth } from "@/hooks/useAuth";
import { useVideoAnalytics } from "@/hooks/useVideoAnalytics";
import { useCreatorFilter } from "@/hooks/useCreatorFilter";
import { useRosterMetrics, useCreatorMetrics } from "@/hooks/useRosterMetrics";
import { useAnalyticsRefresh } from "@/hooks/useAnalyticsRefresh";
import { Users, Youtube, Instagram, TrendingUp, Eye, RefreshCw } from "lucide-react";
import AnalyticsChart from "@/components/AnalyticsChart";
import CreatorMetrics from "@/components/CreatorMetrics";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import RosterAnalyticsTable from "@/components/RosterAnalyticsTable";

const RosterDashboard = () => {
  const { creators, loading } = useRoster();
  const { user } = useAuth();
  const { analyticsData, creatorAnalyticsData, loading: analyticsLoading, fetchVideoAnalytics, refreshVideoAnalytics } = useVideoAnalytics();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  // Use custom hooks for cleaner code
  const creatorFilter = useCreatorFilter(creators);
  const aggregatedAnalytics = useRosterMetrics(analyticsData, creatorAnalyticsData);
  const getCreatorMetrics = useCreatorMetrics(creatorAnalyticsData);
  const analyticsRefresh = useAnalyticsRefresh(fetchVideoAnalytics, refreshVideoAnalytics);

  // Initialize creator selection
  useEffect(() => {
    creatorFilter.initializeSelection();
  }, [creatorFilter.initializeSelection]);

  // Fetch analytics when active creators change
  useEffect(() => {
    if (creatorFilter.activeCreators.length > 0) {
      console.log('Fetching analytics for active creators:', creatorFilter.activeCreators.map(c => ({ id: c.id, name: c.creator_name })));
      fetchVideoAnalytics(
        creatorFilter.activeCreators.map(c => c.id),
        dateRange,
        creatorFilter.selectedPlatform === "all" ? undefined : creatorFilter.selectedPlatform
      );
    }
  }, [creatorFilter.activeCreators.length, dateRange, creatorFilter.selectedPlatform, fetchVideoAnalytics]);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Roster Dashboard</h1>
              <p className="text-gray-600 mt-2">Overview of your creator roster and video analytics</p>
              <p className="text-sm text-gray-500 mt-1">
                Showing daily video performance for {creatorFilter.platformCounts.total} creator{creatorFilter.platformCounts.total !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
              
              <Select value={creatorFilter.selectedPlatform} onValueChange={creatorFilter.setSelectedPlatform}>
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

              <Button 
                onClick={() => analyticsRefresh.handleRefreshAnalytics(creatorFilter.activeCreators, dateRange, creatorFilter.selectedPlatform)} 
                disabled={analyticsRefresh.refreshing || analyticsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${analyticsRefresh.refreshing ? 'animate-spin' : ''}`} />
                Refresh Video Data
              </Button>
              
              <Button 
                onClick={() => analyticsRefresh.handleManualRefresh(creatorFilter.activeCreators, dateRange, creatorFilter.selectedPlatform)} 
                variant="outline" 
                disabled={analyticsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
                Reload Dashboard
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
                <Button variant="outline" size="sm" onClick={creatorFilter.handleSelectAll}>Select All</Button>
                <Button variant="outline" size="sm" onClick={creatorFilter.handleSelectNone}>Select None</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {creatorFilter.filteredCreators.map((creator) => (
                <div key={creator.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={creator.id}
                    checked={creatorFilter.selectedCreatorIds.includes(creator.id)}
                    onCheckedChange={(checked) => creatorFilter.handleCreatorToggle(creator.id, checked as boolean)}
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
                  <div className="text-2xl font-bold">{creatorFilter.platformCounts.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">YouTube Channels</CardTitle>
                  <Youtube className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorFilter.platformCounts.youtube}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Instagram Accounts</CardTitle>
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorFilter.platformCounts.instagram}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">TikTok Accounts</CardTitle>
                  <span className="h-4 w-4 text-muted-foreground font-bold text-xs">T</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorFilter.platformCounts.tiktok}</div>
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
                    data={analyticsData.map(item => ({
                      date: item.date,
                      views: item.daily_views || 0,
                      engagement: item.daily_engagement || 0,
                      subscribers: item.subscribers || 0
                    }))} 
                    selectedPlatform={creatorFilter.selectedPlatform}
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
                {creatorFilter.activeCreators.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    No creators selected. Please select creators from the filter above.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {creatorFilter.activeCreators.map((creator) => {
                      const metrics = getCreatorMetrics(creator.id);
                      if (!metrics) return null;

                      return (
                        <CreatorMetrics
                          key={creator.id}
                          creatorName={creator.creator_name}
                          platforms={[{
                            platform: 'YouTube',
                            views: metrics.views,
                            engagement: metrics.engagement,
                            subscribers: metrics.subscribers,
                            engagementRate: metrics.engagementRate
                          }]}
                        />
                      );
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
