
import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";

interface ClientSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ClientSelect = ({ value, onValueChange }: ClientSelectProps) => {
  const [open, setOpen] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const { clients, loading, createClient } = useClients();

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    
    const newClient = await createClient(newClientName.trim());
    if (newClient) {
      onValueChange(newClient.id);
      setNewClientName("");
      setShowNewClientForm(false);
      setOpen(false);
    }
  };

  const selectedClient = clients.find(client => client.id === value);

  return (
    <div className="space-y-2">
      <Label>Client</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedClient ? selectedClient.name : "Select client..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading..." : "No clients found."}
              </CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name}
                    onSelect={() => {
                      onValueChange(client.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {client.name}
                  </CommandItem>
                ))}
                <CommandItem onSelect={() => setShowNewClientForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add new client
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
          {showNewClientForm && (
            <div className="p-3 border-t">
              <div className="space-y-2">
                <Label htmlFor="newClient">New Client Name</Label>
                <Input
                  id="newClient"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Enter client name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateClient();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleCreateClient}
                    disabled={!newClientName.trim()}
                  >
                    Add Client
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setShowNewClientForm(false);
                      setNewClientName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
