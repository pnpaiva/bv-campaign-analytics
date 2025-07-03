import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays, parseISO } from "date-fns";

interface DailyAnalyticsData {
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
}

interface DailyAnalyticsTableProps {
  data: DailyAnalyticsData[];
  loading: boolean;
}

const DailyAnalyticsTable: React.FC<DailyAnalyticsTableProps> = ({ data, loading }) => {
  // Calculate summary statistics
  const calculateSummary = () => {
    if (data.length === 0) return null;

    const today = new Date();
    const last7Days = data.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= subDays(today, 7);
    });
    const last14Days = data.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= subDays(today, 14);
    });
    const last30Days = data.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= subDays(today, 30);
    });

    const calcAverage = (arr: DailyAnalyticsData[], field: keyof DailyAnalyticsData) => {
      if (arr.length === 0) return 0;
      const sum = arr.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
      return Math.round(sum / arr.length);
    };

    const calcTotal = (arr: DailyAnalyticsData[], field: keyof DailyAnalyticsData) => {
      return arr.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
    };

    return {
      dailyAverage: {
        views: calcAverage(data, 'views'),
        engagement: calcAverage(data, 'engagement'),
        subscribers: calcAverage(data, 'subscribers')
      },
      weeklyAverage: {
        views: calcAverage(last7Days, 'views'),
        engagement: calcAverage(last7Days, 'engagement'),
        subscribers: calcAverage(last7Days, 'subscribers')
      },
      last30Days: {
        views: calcTotal(last30Days, 'views'),
        engagement: calcTotal(last30Days, 'engagement'),
        subscribers: calcTotal(last30Days, 'subscribers')
      },
      last14Days: {
        views: calcTotal(last14Days, 'views'),
        engagement: calcTotal(last14Days, 'engagement'),
        subscribers: calcTotal(last14Days, 'subscribers')
      }
    };
  };

  const summary = calculateSummary();

  // Prepare chart data
  const chartData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    views: Number(item.views) || 0,
    engagement: Number(item.engagement) || 0,
    subscribers: Number(item.subscribers) || 0
  }));

  const chartConfig = {
    views: {
      label: "Views",
      color: "hsl(var(--chart-1))",
    },
    engagement: {
      label: "Engagement", 
      color: "hsl(var(--chart-2))",
    },
    subscribers: {
      label: "Subscribers",
      color: "hsl(var(--chart-3))",
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No analytics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Date</th>
                  <th className="text-right p-2 font-medium">Subscribers</th>
                  <th className="text-right p-2 font-medium">Views</th>
                  <th className="text-right p-2 font-medium">Subs (Engagement)</th>
                  <th className="text-right p-2 font-medium">Subs Growth</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-7).map((item, index) => {
                  const prevItem = index > 0 ? data[data.indexOf(item) - 1] : null;
                  const viewsGrowth = prevItem ? item.views - prevItem.views : 0;
                  const subscriberGrowth = prevItem ? item.subscribers - prevItem.subscribers : 0;
                  
                  return (
                    <tr key={item.date} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {format(parseISO(item.date), 'EEE')}
                          </span>
                          <span className="text-muted-foreground">
                            {format(parseISO(item.date), 'yyyy-MM-dd')}
                          </span>
                        </div>
                      </td>
                      <td className="text-right p-2 font-mono">
                        {Number(item.subscribers).toLocaleString()}
                        {subscriberGrowth !== 0 && (
                          <div className="text-xs text-muted-foreground">
                            {subscriberGrowth > 0 ? '+' : ''}{subscriberGrowth.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {Number(item.views).toLocaleString()}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {/* For channels, show subscriber count as engagement metric */}
                        {Number(item.subscribers).toLocaleString()}
                      </td>
                      <td className="text-right p-2">
                        {viewsGrowth !== 0 && (
                          <Badge 
                            variant={viewsGrowth > 0 ? "default" : "secondary"}
                            className={viewsGrowth > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {viewsGrowth > 0 ? '+' : ''}{viewsGrowth.toLocaleString()}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          {summary && (
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Daily Average</div>
                  <div className="text-sm space-y-1">
                    <div>Views: <span className="font-mono">{summary.dailyAverage.views.toLocaleString()}</span></div>
                    <div>Engagement: <span className="font-mono">{summary.dailyAverage.engagement.toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Weekly Average</div>
                  <div className="text-sm space-y-1">
                    <div>Views: <span className="font-mono">{summary.weeklyAverage.views.toLocaleString()}</span></div>
                    <div>Engagement: <span className="font-mono">{summary.weeklyAverage.engagement.toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Last 30 Days</div>
                  <div className="text-sm space-y-1">
                    <div>Views: <span className="font-mono">{summary.last30Days.views.toLocaleString()}</span></div>
                    <div>Engagement: <span className="font-mono">{summary.last30Days.engagement.toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Last 14 Days</div>
                  <div className="text-sm space-y-1">
                    <div>Views: <span className="font-mono">{summary.last14Days.views.toLocaleString()}</span></div>
                    <div>Engagement: <span className="font-mono">{summary.last14Days.engagement.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Views Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="var(--color-views)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-views)", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="var(--color-engagement)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-engagement)", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyAnalyticsTable;