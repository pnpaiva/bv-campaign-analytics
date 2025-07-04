
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
  // Calculate summary statistics using ONLY daily values
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

    const calcTotal = (arr: RosterAnalyticsData[], field: 'daily_views' | 'daily_engagement' | 'subscribers') => {
      return arr.reduce((acc, item) => {
        if (field === 'daily_views') return acc + (item.daily_views || 0);
        if (field === 'daily_engagement') return acc + (item.daily_engagement || 0);
        if (field === 'subscribers') return acc + (item.subscribers || 0);
        return acc;
      }, 0);
    };

    const calcAverage = (arr: RosterAnalyticsData[], field: 'daily_views' | 'daily_engagement') => {
      if (arr.length === 0) return 0;
      const sum = calcTotal(arr, field);
      return Math.round(sum / arr.length);
    };

    // Get current total subscribers from the latest data across all creators
    const latestDate = data[data.length - 1]?.date;
    const currentSubscribers = latestDate ? 
      creatorData
        .filter(item => item.date === latestDate)
        .reduce((sum, item) => sum + item.subscribers, 0) : 0;

    return {
      currentSubscribers,
      totalViews: calcTotal(data, 'daily_views'),
      totalVideos: data.reduce((acc, item) => acc + (item.videosPosted || 0), 0),
      last7Days: {
        views: calcTotal(last7Days, 'daily_views'),
        videos: last7Days.reduce((acc, item) => acc + (item.videosPosted || 0), 0),
        avgViews: calcAverage(last7Days, 'daily_views')
      },
      last30Days: {
        views: calcTotal(last30Days, 'daily_views'),
        videos: last30Days.reduce((acc, item) => acc + (item.videosPosted || 0), 0),
        avgViews: calcAverage(last30Days, 'daily_views')
      }
    };
  };

  const summary = calculateSummary();

  // Prepare chart data using ONLY daily values
  const chartData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    views: item.daily_views || 0, // ONLY daily views
    engagement: item.daily_engagement || 0, // ONLY daily engagement
    subscribers: item.subscribers || 0, // Daily subscriber changes
    videosPosted: Number(item.videosPosted) || 0
  }));

  const chartConfig = {
    views: {
      label: "Daily Views",
      color: "hsl(var(--chart-1))",
    },
    engagement: {
      label: "Daily Engagement", 
      color: "hsl(var(--chart-2))",
    },
    subscribers: {
      label: "Daily Subscriber Changes",
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
          <CardTitle>Daily Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading daily analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No daily analytics data available</p>
            <p className="text-sm text-muted-foreground mt-2">Try refreshing the data to fetch latest YouTube statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - Daily Values Only */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.currentSubscribers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Current Total Subscribers</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.totalViews.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Daily Views (Period)</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.last7Days.views.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Daily Views (Last 7 Days)</div>
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

      {/* Daily Performance Table - EXPLICITLY SHOWING DAILY VALUES ONLY */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance (Per Day, Not Cumulative)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Daily Subscriber Growth</TableHead>
                <TableHead className="text-right">Daily Views</TableHead>
                <TableHead className="text-right">Daily Engagement</TableHead>
                <TableHead className="text-right">Videos Posted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(-10).reverse().map((item, index) => {
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
                      <Badge variant={item.subscribers > 0 ? "default" : "secondary"}>
                        {item.subscribers > 0 ? '+' : ''}{(item.subscribers || 0).toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="text-blue-600 font-semibold">
                        {(item.daily_views || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="text-green-600 font-semibold">
                        {(item.daily_engagement || 0).toLocaleString()}
                      </span>
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

      {/* Charts - Daily Values Only */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Views (Per Day)</CardTitle>
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
            <CardTitle>Daily Engagement (Per Day)</CardTitle>
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
