
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MessageSquare, TrendingUp, DollarSign, Calendar, Users } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";

export default function Dashboard() {
  const { campaigns, loading } = useCampaigns();

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

  // Calculate totals
  const totalViews = campaigns.reduce((sum, campaign) => sum + (campaign.total_views || 0), 0);
  const totalEngagement = campaigns.reduce((sum, campaign) => sum + (campaign.total_engagement || 0), 0);
  const totalDealValue = campaigns.reduce((sum, campaign) => sum + (campaign.deal_value || 0), 0);
  const avgEngagementRate = campaigns.length > 0 
    ? campaigns.reduce((sum, campaign) => sum + (campaign.engagement_rate || 0), 0) / campaigns.length 
    : 0;

  // Recent campaigns (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCampaigns = campaigns.filter(campaign => 
    new Date(campaign.campaign_date) >= thirtyDaysAgo
  );

  // Status breakdown
  const statusCounts = campaigns.reduce((acc, campaign) => {
    acc[campaign.status] = (acc[campaign.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your influencer campaigns performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across {campaigns.length} campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEngagement.toLocaleString()}</div>
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
              <div className="text-2xl font-bold">{avgEngagementRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Average across all campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deal Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalDealValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total campaign value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Campaigns from the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCampaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{campaign.brand_name}</p>
                      <p className="text-sm text-gray-600">{campaign.creators?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{campaign.total_views?.toLocaleString()} views</p>
                      <p className="text-xs text-gray-500">
                        {new Date(campaign.campaign_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentCampaigns.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent campaigns</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Status</CardTitle>
              <CardDescription>Breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'completed' ? 'bg-green-500' :
                        status === 'analyzing' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="capitalize">{status}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(statusCounts).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No campaigns yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Campaigns</CardTitle>
            <CardDescription>Campaigns with highest engagement rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns
                .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
                .slice(0, 5)
                .map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.brand_name}</p>
                      <p className="text-sm text-gray-600">{campaign.creators?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-purple-600">
                        {campaign.engagement_rate?.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500">
                        {campaign.total_views?.toLocaleString()} views
                      </p>
                    </div>
                  </div>
                ))}
              {campaigns.length === 0 && (
                <p className="text-gray-500 text-center py-4">No campaigns to display</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
