
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays, parseISO } from "date-fns";

interface RosterAnalyticsData {
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  videosPosted?: number;
  daily_views?: number;
  daily_engagement?: number;
}

interface CreatorAnalyticsData {
  creator_id: string;
  creator_name: string;
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  daily_views: number;
  daily_engagement: number;
}

interface RosterAnalyticsTableProps {
  data: RosterAnalyticsData[];
  creatorData?: CreatorAnalyticsData[];
  loading: boolean;
}

const RosterAnalyticsTable: React.FC<RosterAnalyticsTableProps> = ({ data, creatorData = [], loading }) => {
  // Calculate summary statistics
  const calculateSummary = () => {
    if (data.length === 0) return null;

    const today = new Date();
    const last7Days = data.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= subDays(today, 7);
    });
    const last30Days = data.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= subDays(today, 30);
    });

    const calcAverage = (arr: RosterAnalyticsData[], field: keyof RosterAnalyticsData) => {
      if (arr.length === 0) return 0;
      const sum = arr.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
      return Math.round(sum / arr.length);
    };

    const calcTotal = (arr: RosterAnalyticsData[], field: keyof RosterAnalyticsData) => {
      return arr.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
    };

    const latestData = data[data.length - 1];

    return {
      currentSubscribers: latestData?.subscribers || 0,
      totalViews: calcTotal(data, 'views'),
      totalVideos: calcTotal(data, 'videosPosted'),
      last7Days: {
        views: calcTotal(last7Days, 'views'),
        videos: calcTotal(last7Days, 'videosPosted'),
        avgViews: calcAverage(last7Days, 'views')
      },
      last30Days: {
        views: calcTotal(last30Days, 'views'),
        videos: calcTotal(last30Days, 'videosPosted'),
        avgViews: calcAverage(last30Days, 'views')
      }
    };
  };

  const summary = calculateSummary();

  // Get daily aggregated data from creator data for more accurate daily metrics
  const getDailyAggregatedData = () => {
    if (creatorData.length === 0) return data;

    const dailyMap = new Map<string, { date: string; daily_views: number; daily_engagement: number; subscribers: number }>();
    
    creatorData.forEach(item => {
      const existing = dailyMap.get(item.date) || { 
        date: item.date, 
        daily_views: 0, 
        daily_engagement: 0, 
        subscribers: 0 
      };
      
      existing.daily_views += item.daily_views;
      existing.daily_engagement += item.daily_engagement;
      existing.subscribers = Math.max(existing.subscribers, item.subscribers); // Take max for subscribers
      
      dailyMap.set(item.date, existing);
    });

    return Array.from(dailyMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const dailyAggregatedData = getDailyAggregatedData();

  // Prepare chart data
  const chartData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    views: Number(item.views) || 0,
    engagement: Number(item.engagement) || 0,
    subscribers: Number(item.subscribers) || 0,
    videosPosted: Number(item.videosPosted) || 0
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
    },
    videosPosted: {
      label: "Videos Posted",
      color: "hsl(var(--chart-4))",
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Channel Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading channel analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Channel Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No channel analytics data available</p>
            <p className="text-sm text-muted-foreground mt-2">Try refreshing the data to fetch latest YouTube statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.currentSubscribers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Subscribers</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.totalViews.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.totalVideos.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Videos</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.last7Days.avgViews.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Avg Daily Views (7d)</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Channel Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Channel Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Subscribers</TableHead>
                <TableHead className="text-right">Daily Views</TableHead>
                <TableHead className="text-right">Daily Engagement</TableHead>
                <TableHead className="text-right">Videos Posted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(-10).map((item, index) => {
                // Find corresponding daily data for more accurate daily metrics
                const dailyData = dailyAggregatedData.find(d => d.date === item.date);
                const actualDailyViews = dailyData?.daily_views || item.daily_views || item.views;
                const actualDailyEngagement = dailyData?.daily_engagement || item.daily_engagement || item.engagement;
                
                return (
                  <TableRow key={item.date}>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {format(parseISO(item.date), 'EEE')}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(item.date), 'yyyy-MM-dd')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(item.subscribers).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {actualDailyViews.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {actualDailyEngagement.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(item.videosPosted || 0)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Views Trend</CardTitle>
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
            <CardTitle>Daily Engagement Trend</CardTitle>
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

export default RosterAnalyticsTable;
