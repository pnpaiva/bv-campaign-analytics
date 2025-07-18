
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, ExternalLink } from "lucide-react";
import { useRoster } from "@/hooks/useRoster";
import { useAuth } from "@/hooks/useAuth";
import type { RosterCreator } from "@/hooks/useRoster";

const Roster = () => {
  const { creators, loading, addCreator, updateCreator, deleteCreator } = useRoster();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<RosterCreator | null>(null);
  const [formData, setFormData] = useState({
    creator_name: '',
    youtube_channel: '',
    instagram_handle: '',
    tiktok_handle: '',
  });

  const resetForm = () => {
    setFormData({
      creator_name: '',
      youtube_channel: '',
      instagram_handle: '',
      tiktok_handle: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const creatorData = {
      creator_name: formData.creator_name,
      channel_links: {
        youtube: formData.youtube_channel,
      },
      social_media_handles: {
        instagram: formData.instagram_handle,
        tiktok: formData.tiktok_handle,
      },
    };

    if (editingCreator) {
      await updateCreator(editingCreator.id, creatorData);
      setEditingCreator(null);
    } else {
      await addCreator(creatorData);
      setIsAddDialogOpen(false);
    }
    
    resetForm();
  };

  const handleEdit = (creator: RosterCreator) => {
    setEditingCreator(creator);
    const channelLinks = getJsonObject(creator.channel_links);
    const socialHandles = getJsonObject(creator.social_media_handles);
    
    setFormData({
      creator_name: creator.creator_name,
      youtube_channel: getStringValue(channelLinks, 'youtube'),
      instagram_handle: getStringValue(socialHandles, 'instagram'),
      tiktok_handle: getStringValue(socialHandles, 'tiktok'),
    });
  };

  // Helper function to safely convert Json to object
  const getJsonObject = (jsonObj: any): Record<string, any> => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return jsonObj;
    }
    return {};
  };

  // Helper function to safely get string value from Json
  const getStringValue = (jsonObj: any, key: string): string => {
    if (jsonObj && typeof jsonObj === 'object' && !Array.isArray(jsonObj)) {
      return jsonObj[key] || '';
    }
    return '';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please sign in to manage your creator roster.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Creator Roster</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Creator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Creator</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="creator_name">Creator Name</Label>
                  <Input
                    id="creator_name"
                    value={formData.creator_name}
                    onChange={(e) => setFormData({ ...formData, creator_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="youtube_channel">YouTube Channel URL</Label>
                  <Input
                    id="youtube_channel"
                    placeholder="https://www.youtube.com/@channelname"
                    value={formData.youtube_channel}
                    onChange={(e) => setFormData({ ...formData, youtube_channel: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="instagram_handle">Instagram Handle</Label>
                  <Input
                    id="instagram_handle"
                    placeholder="@username"
                    value={formData.instagram_handle}
                    onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tiktok_handle">TikTok Handle</Label>
                  <Input
                    id="tiktok_handle"
                    placeholder="@username"
                    value={formData.tiktok_handle}
                    onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Creator</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : creators.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-600">No creators in your roster yet. Add one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => {
              const channelLinks = getJsonObject(creator.channel_links);
              const socialHandles = getJsonObject(creator.social_media_handles);
              
              return (
                <Card key={creator.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {creator.creator_name}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(creator)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCreator(creator.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getStringValue(channelLinks, 'youtube') && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">YouTube:</span>
                          <a
                            href={getStringValue(channelLinks, 'youtube')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                          >
                            Channel <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {getStringValue(socialHandles, 'instagram') && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Instagram:</span>
                          <span className="text-sm">{getStringValue(socialHandles, 'instagram')}</span>
                        </div>
                      )}
                      {getStringValue(socialHandles, 'tiktok') && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">TikTok:</span>
                          <span className="text-sm">{getStringValue(socialHandles, 'tiktok')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {editingCreator && (
          <Dialog open={!!editingCreator} onOpenChange={() => setEditingCreator(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Creator</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit_creator_name">Creator Name</Label>
                  <Input
                    id="edit_creator_name"
                    value={formData.creator_name}
                    onChange={(e) => setFormData({ ...formData, creator_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_youtube_channel">YouTube Channel URL</Label>
                  <Input
                    id="edit_youtube_channel"
                    placeholder="https://www.youtube.com/@channelname"
                    value={formData.youtube_channel}
                    onChange={(e) => setFormData({ ...formData, youtube_channel: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_instagram_handle">Instagram Handle</Label>
                  <Input
                    id="edit_instagram_handle"
                    placeholder="@username"
                    value={formData.instagram_handle}
                    onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_tiktok_handle">TikTok Handle</Label>
                  <Input
                    id="edit_tiktok_handle"
                    placeholder="@username"
                    value={formData.tiktok_handle}
                    onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Update Creator</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingCreator(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Roster;
