
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";

interface AnalyticsData {
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
  selectedPlatform: string;
}

const AnalyticsChart = ({ data, selectedPlatform }: AnalyticsChartProps) => {
  const chartConfig = {
    views: {
      label: "Views",
      color: "#8884d8",
    },
    engagement: {
      label: "Engagement",
      color: "#82ca9d",
    },
    subscribers: {
      label: "Subscribers",
      color: "#ffc658",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Analytics Overview {selectedPlatform !== "all" && `- ${selectedPlatform}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke={chartConfig.views.color} 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Views"
              />
              <Line 
                type="monotone" 
                dataKey="engagement" 
                stroke={chartConfig.engagement.color} 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Engagement"
              />
              <Line 
                type="monotone" 
                dataKey="subscribers" 
                stroke={chartConfig.subscribers.color} 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Subscribers"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;
