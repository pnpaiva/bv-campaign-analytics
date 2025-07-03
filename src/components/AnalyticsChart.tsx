
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

interface AnalyticsChartProps {
  data: Array<{
    date: string;
    views: number;
    engagement: number;
    subscribers: number;
  }>;
  selectedPlatform: string;
  loading?: boolean;
}

const AnalyticsChart = ({ data, selectedPlatform, loading = false }: AnalyticsChartProps) => {
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
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview - {selectedPlatform === "all" ? "All Platforms" : selectedPlatform}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview - {selectedPlatform === "all" ? "All Platforms" : selectedPlatform}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-2">No analytics data available</p>
              <p className="text-sm text-gray-500">Try refreshing the data or selecting a different date range</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Overview - {selectedPlatform === "all" ? "All Platforms" : selectedPlatform}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="var(--color-views)" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="engagement" 
                stroke="var(--color-engagement)" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="subscribers" 
                stroke="var(--color-subscribers)" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;
