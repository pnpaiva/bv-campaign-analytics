
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, Users, DollarSign, Youtube, Instagram, FileText, Download, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  
  // Sample data for demonstration
  const campaignData = [
    { name: "Week 1", views: 45000, engagement: 3200, reach: 38000 },
    { name: "Week 2", views: 52000, engagement: 4100, reach: 42000 },
    { name: "Week 3", views: 48000, engagement: 3800, reach: 40000 },
    { name: "Week 4", views: 61000, engagement: 4900, reach: 51000 },
  ];

  const platformData = [
    { name: "YouTube", value: 45, color: "#FF0000" },
    { name: "Instagram", value: 35, color: "#E4405F" },
    { name: "TikTok", value: 20, color: "#000000" },
  ];

  const campaigns = [
    {
      id: 1,
      brand: "Nike",
      creator: "@fitnessguru",
      date: "2024-06-28",
      status: "completed",
      totalViews: "2.3M",
      engagementRate: "4.2%",
      dealValue: "$15,000"
    },
    {
      id: 2,
      brand: "Samsung",
      creator: "@techreviewer",
      date: "2024-06-25",
      status: "analyzing",
      totalViews: "890K",
      engagementRate: "3.8%",
      dealValue: "$8,500"
    },
    {
      id: 3,
      brand: "Starbucks",
      creator: "@coffeeaddict",
      date: "2024-06-20",
      status: "completed",
      totalViews: "1.1M",
      engagementRate: "5.1%",
      dealValue: "$12,000"
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Beyond Views</CardTitle>
            <CardDescription>Professional influencer marketing analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" />
            </div>
            <Button 
              className="w-full" 
              onClick={() => setIsAuthenticated(true)}
            >
              Sign In
            </Button>
            <p className="text-sm text-center text-gray-600">
              Demo mode - Click Sign In to continue
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Beyond Views</h1>
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentView === "dashboard"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView("campaigns")}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentView === "campaigns"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Campaigns
                </button>
                <button
                  onClick={() => setCurrentView("new-campaign")}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentView === "new-campaign"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  New Campaign
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAuthenticated(false)}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "dashboard" && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                      <p className="text-3xl font-bold text-gray-900">24</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <p className="text-3xl font-bold text-gray-900">8.2M</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Engagement</p>
                      <p className="text-3xl font-bold text-gray-900">4.1%</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-red-600 mt-2">-2% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">$485K</p>
                    </div>
                    <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">+18% from last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Views and engagement over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={campaignData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                  <CardDescription>Campaign distribution by platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentView === "campaigns" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Campaign Management</h2>
              <Button onClick={() => setCurrentView("new-campaign")}>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input className="pl-10" placeholder="Search campaigns..." />
              </div>
            </div>

            <div className="grid gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.brand}</h3>
                          <p className="text-sm text-gray-600">{campaign.creator}</p>
                        </div>
                        <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div>
                          <p className="font-medium">{campaign.totalViews}</p>
                          <p>Total Views</p>
                        </div>
                        <div>
                          <p className="font-medium">{campaign.engagementRate}</p>
                          <p>Engagement</p>
                        </div>
                        <div>
                          <p className="font-medium">{campaign.dealValue}</p>
                          <p>Deal Value</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentView === "new-campaign" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Campaign</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Enter the basic information for your campaign analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand Name</Label>
                    <Input id="brand" placeholder="Enter brand name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creator">Creator Name</Label>
                    <Input id="creator" placeholder="Enter creator name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Campaign Date</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deal">Deal Value (Optional)</Label>
                    <Input id="deal" placeholder="$0.00" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content URLs</CardTitle>
                <CardDescription>Add URLs from YouTube, Instagram, and TikTok</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Youtube className="h-4 w-4 mr-2 text-red-600" />
                    YouTube URLs
                  </Label>
                  <Input placeholder="https://youtube.com/watch?v=..." />
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another YouTube URL
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                    Instagram URLs
                  </Label>
                  <Input placeholder="https://instagram.com/p/..." />
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Instagram URL
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <div className="h-4 w-4 mr-2 bg-black rounded"></div>
                    TikTok URLs
                  </Label>
                  <Input placeholder="https://tiktok.com/@user/video/..." />
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another TikTok URL
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setCurrentView("campaigns")}>
                Cancel
              </Button>
              <Button onClick={() => setCurrentView("campaigns")}>
                Create Campaign
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
