
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useCreators } from "@/hooks/useCreators";

interface CreatorSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export const CreatorSelect = ({ value, onValueChange }: CreatorSelectProps) => {
  const { creators, loading, createCreator } = useCreators();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState("");

  const handleCreateCreator = async () => {
    if (!newCreatorName.trim()) return;
    
    const creator = await createCreator(newCreatorName.trim());
    if (creator) {
      onValueChange(creator.id);
      setNewCreatorName("");
      setIsDialogOpen(false);
    }
  };

  const selectedCreator = creators.find(creator => creator.id === value);

  return (
    <div className="space-y-2">
      <Label>Creator</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a creator" />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <SelectItem value="loading" disabled>Loading...</SelectItem>
            ) : creators.length === 0 ? (
              <SelectItem value="no-creators" disabled>No creators found</SelectItem>
            ) : (
              creators.map((creator) => (
                <SelectItem key={creator.id} value={creator.id}>
                  {creator.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Creator</DialogTitle>
              <DialogDescription>
                Create a new creator profile to use in campaigns.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creator-name">Creator Name</Label>
                <Input
                  id="creator-name"
                  value={newCreatorName}
                  onChange={(e) => setNewCreatorName(e.target.value)}
                  placeholder="Enter creator name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCreator}>
                  Add Creator
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
