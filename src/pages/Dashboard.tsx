import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MessageSquare, TrendingUp } from "lucide-react";
import { useDashboardAnalytics, DashboardFilters as DashboardFiltersType } from "@/hooks/useDashboardAnalytics";
import { DashboardFilters } from "@/components/DashboardFilters";
import { DashboardCharts } from "@/components/DashboardCharts";

export default function Dashboard() {
  const {
    metrics,
    trends,
    topContent,
    loading,
    refreshData,
  } = useDashboardAnalytics();

  const handleFiltersChange = (filters: DashboardFiltersType) => {
    console.log('Applying filters:', filters);
    refreshData(filters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive overview of your influencer campaigns performance</p>
        </div>

        {/* Filters */}
        <DashboardFilters onFiltersChange={handleFiltersChange} loading={loading} />

        {/* Key Metrics - Removed Total Deal Value */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total_views?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across {metrics?.total_campaigns || 0} campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total_engagement?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Likes, comments, shares
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(metrics?.avg_engagement_rate || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Average across all content
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <DashboardCharts 
          metrics={metrics}
          trends={trends}
          topContent={topContent}
        />

        {/* Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Insights</CardTitle>
              <CardDescription>Performance breakdown by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.platform_breakdown && Object.entries(metrics.platform_breakdown).map(([platform, data]: [string, any]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="capitalize font-medium">{platform}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{data.views?.toLocaleString() || 0} views</div>
                      <div className="text-sm text-gray-500">{data.campaigns || 0} campaigns</div>
                    </div>
                  </div>
                ))}
                {(!metrics?.platform_breakdown || Object.keys(metrics.platform_breakdown).length === 0) && (
                  <p className="text-gray-500 text-center py-4">No platform data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Creator Insights</CardTitle>
              <CardDescription>Top performing creators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.creator_performance && Object.entries(metrics.creator_performance)
                  .slice(0, 5)
                  .map(([creator, data]: [string, any]) => (
                    <div key={creator} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="font-medium">{creator}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{data.views?.toLocaleString() || 0} views</div>
                        <div className="text-sm text-gray-500">{Number(data.avg_engagement_rate || 0).toFixed(1)}% rate</div>
                      </div>
                    </div>
                  ))}
                {(!metrics?.creator_performance || Object.keys(metrics.creator_performance).length === 0) && (
                  <p className="text-gray-500 text-center py-4">No creator data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
