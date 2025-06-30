
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { DashboardMetrics, CampaignTrend, TopContent } from "@/hooks/useDashboardAnalytics";

interface DashboardChartsProps {
  metrics: DashboardMetrics | null;
  trends: CampaignTrend[];
  topContent: TopContent[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

const chartConfig = {
  views: {
    label: "Views",
    color: "#8884d8",
  },
  engagement: {
    label: "Engagement",
    color: "#82ca9d",
  },
  campaigns: {
    label: "Campaigns",
    color: "#ffc658",
  },
  engagement_rate: {
    label: "Engagement Rate",
    color: "#ff7300",
  },
};

export const DashboardCharts = ({ metrics, trends, topContent }: DashboardChartsProps) => {
  // Prepare platform breakdown data for pie chart
  const platformData = metrics?.platform_breakdown ? 
    Object.entries(metrics.platform_breakdown).map(([platform, data]: [string, any]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: data.views || 0,
      engagement: data.engagement || 0,
      campaigns: data.campaigns || 0,
    })) : [];

  // Prepare creator performance data for bar chart
  const creatorData = metrics?.creator_performance ? 
    Object.entries(metrics.creator_performance)
      .map(([creator, data]: [string, any]) => ({
        name: creator,
        views: data.views || 0,
        engagement: data.engagement || 0,
        campaigns: data.campaigns || 0,
        engagement_rate: data.avg_engagement_rate || 0,
      }))
      .slice(0, 10) // Top 10 creators
    : [];

  // Use the monthly trends data directly from metrics
  const monthlyData = metrics?.monthly_trends ? 
    Object.entries(metrics.monthly_trends)
      .map(([month, data]: [string, any]) => ({
        month: month,
        views: data.views || 0,
        engagement: data.engagement || 0,
        campaigns: data.campaigns || 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Monthly Trends Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Performance Trends</CardTitle>
          <CardDescription>Views and engagement by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="views"
                stroke={chartConfig.views.color}
                strokeWidth={2}
                name="Total Views"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="engagement"
                stroke={chartConfig.engagement.color}
                strokeWidth={2}
                name="Total Engagement"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Platform Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
          <CardDescription>Views by platform</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                dataKey="value"
                data={platformData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Creator Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Creator Performance</CardTitle>
          <CardDescription>Views and engagement by creator</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={creatorData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="views" fill={chartConfig.views.color} name="Views" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Overview Bar Chart */}
      {monthlyData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>Monthly performance summary</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="views" fill={chartConfig.views.color} name="Views" />
                <Bar dataKey="engagement" fill={chartConfig.engagement.color} name="Engagement" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Content */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
          <CardDescription>Best performing videos by views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topContent.slice(0, 5).map((content, index) => (
              <div key={content.campaign_id + content.content_url} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{content.brand_name}</p>
                  <p className="text-sm text-gray-600">{content.creator_name} • {content.platform}</p>
                  <p className="text-xs text-gray-500 truncate max-w-md">{content.content_url}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-purple-600">
                    {content.views?.toLocaleString()} views
                  </p>
                  <p className="text-sm text-gray-500">
                    {content.engagement?.toLocaleString()} engagement
                  </p>
                  <p className="text-xs text-gray-400">
                    {content.engagement_rate?.toFixed(1)}% rate
                  </p>
                </div>
              </div>
            ))}
            {topContent.length === 0 && (
              <p className="text-gray-500 text-center py-4">No content data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
