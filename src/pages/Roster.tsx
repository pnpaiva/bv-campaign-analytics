
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, ExternalLink } from "lucide-react";
import { useRoster } from "@/hooks/useRoster";
import { useAuth } from "@/hooks/useAuth";

const Roster = () => {
  const { creators, loading, addCreator, updateCreator, deleteCreator } = useRoster();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState(null);
  const [formData, setFormData] = useState({
    creator_name: '',
    youtube_channel: '',
    instagram_handle: '',
    tiktok_handle: '',
    twitter_handle: '',
  });

  const resetForm = () => {
    setFormData({
      creator_name: '',
      youtube_channel: '',
      instagram_handle: '',
      tiktok_handle: '',
      twitter_handle: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const creatorData = {
      creator_name: formData.creator_name,
      channel_links: {
        youtube: formData.youtube_channel,
      },
      social_media_handles: {
        instagram: formData.instagram_handle,
        tiktok: formData.tiktok_handle,
        twitter: formData.twitter_handle,
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

  const handleEdit = (creator) => {
    setEditingCreator(creator);
    setFormData({
      creator_name: creator.creator_name,
      youtube_channel: creator.channel_links?.youtube || '',
      instagram_handle: creator.social_media_handles?.instagram || '',
      tiktok_handle: creator.social_media_handles?.tiktok || '',
      twitter_handle: creator.social_media_handles?.twitter || '',
    });
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
                <div>
                  <Label htmlFor="twitter_handle">Twitter Handle</Label>
                  <Input
                    id="twitter_handle"
                    placeholder="@username"
                    value={formData.twitter_handle}
                    onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
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
            {creators.map((creator) => (
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
                    {creator.channel_links?.youtube && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">YouTube:</span>
                        <a
                          href={creator.channel_links.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                        >
                          Channel <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {creator.social_media_handles?.instagram && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Instagram:</span>
                        <span className="text-sm">{creator.social_media_handles.instagram}</span>
                      </div>
                    )}
                    {creator.social_media_handles?.tiktok && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">TikTok:</span>
                        <span className="text-sm">{creator.social_media_handles.tiktok}</span>
                      </div>
                    )}
                    {creator.social_media_handles?.twitter && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Twitter:</span>
                        <span className="text-sm">{creator.social_media_handles.twitter}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <div>
                  <Label htmlFor="edit_twitter_handle">Twitter Handle</Label>
                  <Input
                    id="edit_twitter_handle"
                    placeholder="@username"
                    value={formData.twitter_handle}
                    onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
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
