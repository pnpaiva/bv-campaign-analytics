
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoster } from "@/hooks/useRoster";
import { useAuth } from "@/hooks/useAuth";
import { Users, Youtube, Instagram, Twitter } from "lucide-react";

const RosterDashboard = () => {
  const { creators, loading } = useRoster();
  const { user } = useAuth();

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

  const totalCreators = creators.length;
  const creatorsWithYoutube = creators.filter(c => c.channel_links?.youtube).length;
  const creatorsWithInstagram = creators.filter(c => c.social_media_handles?.instagram).length;
  const creatorsWithTiktok = creators.filter(c => c.social_media_handles?.tiktok).length;
  const creatorsWithTwitter = creators.filter(c => c.social_media_handles?.twitter).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Roster Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your creator roster and analytics</p>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCreators}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">YouTube Channels</CardTitle>
                  <Youtube className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorsWithYoutube}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Instagram Accounts</CardTitle>
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorsWithInstagram}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Social Accounts</CardTitle>
                  <Twitter className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorsWithTwitter + creatorsWithTiktok}</div>
                </CardContent>
              </Card>
            </div>

            {/* Creator List */}
            <Card>
              <CardHeader>
                <CardTitle>Creator Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {creators.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    No creators in your roster yet. Add creators to see their analytics here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {creators.map((creator) => (
                      <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{creator.creator_name}</h3>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            {creator.channel_links?.youtube && (
                              <div className="flex items-center gap-1">
                                <Youtube className="h-3 w-3" />
                                <span>YouTube</span>
                              </div>
                            )}
                            {creator.social_media_handles?.instagram && (
                              <div className="flex items-center gap-1">
                                <Instagram className="h-3 w-3" />
                                <span>Instagram</span>
                              </div>
                            )}
                            {creator.social_media_handles?.tiktok && (
                              <div className="flex items-center gap-1">
                                <span className="font-bold">T</span>
                                <span>TikTok</span>
                              </div>
                            )}
                            {creator.social_media_handles?.twitter && (
                              <div className="flex items-center gap-1">
                                <Twitter className="h-3 w-3" />
                                <span>Twitter</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            Added {new Date(creator.created_at).toLocaleDateString()}
                          </div>
                          {creator.last_updated && (
                            <div className="text-xs text-gray-400">
                              Updated {new Date(creator.last_updated).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Future Analytics Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Analytics Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Channel analytics and performance metrics will be displayed here once the data fetching system is integrated.
                  This will include subscriber counts, view counts, engagement rates, and trend analysis for each creator in your roster.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default RosterDashboard;
