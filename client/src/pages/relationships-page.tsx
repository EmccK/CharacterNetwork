import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import RelationshipForm from "@/components/relationship/relationship-form";
import RelationshipGraph from "@/components/relationship/relationship-graph";
import { Link, Plus, PenSquare, Trash } from "lucide-react";
import { useLocation } from "wouter";

export default function RelationshipsPage() {
  const [selectedNovelId, setSelectedNovelId] = useState<string>("");
  const [isAddRelationshipModalOpen, setIsAddRelationshipModalOpen] = useState(false);
  const [isAddRelationshipTypeModalOpen, setIsAddRelationshipTypeModalOpen] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Fetch novels
  const { data: novels = [] } = useQuery({
    queryKey: ["/api/novels"],
  });
  
  // Fetch relationship types
  const { data: relationshipTypes = [] } = useQuery({
    queryKey: ["/api/relationship-types"],
  });
  
  // Fetch characters and relationships for selected novel
  const { data: characters = [], isLoading: isCharactersLoading } = useQuery({
    queryKey: [`/api/novels/${selectedNovelId}/characters`],
    enabled: !!selectedNovelId,
  });
  
  const { data: relationships = [], isLoading: isRelationshipsLoading } = useQuery({
    queryKey: [`/api/novels/${selectedNovelId}/relationships`],
    enabled: !!selectedNovelId,
  });
  
  const isLoading = isCharactersLoading || isRelationshipsLoading;
  
  const handleRelationshipTypeSubmit = async (data: any) => {
    try {
      await apiRequest("POST", "/api/relationship-types", {
        name: data.name,
        color: data.color,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/relationship-types"] });
      setIsAddRelationshipTypeModalOpen(false);
      toast({
        title: "Relationship type added",
        description: "The relationship type has been successfully added",
      });
    } catch (error: any) {
      toast({
        title: "Failed to add relationship type",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Relationships" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Character Relationships</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddRelationshipTypeModalOpen(true)}
                >
                  <PenSquare className="h-4 w-4 mr-2" /> Add Relationship Type
                </Button>
                <Button
                  onClick={() => setIsAddRelationshipModalOpen(true)}
                  disabled={!selectedNovelId || characters.length < 2}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Relationship
                </Button>
              </div>
            </div>
            
            {/* Novel selector */}
            <div className="mb-6">
              <Select value={selectedNovelId} onValueChange={setSelectedNovelId}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select a novel to view relationships" />
                </SelectTrigger>
                <SelectContent>
                  {novels.map((novel: any) => (
                    <SelectItem key={novel.id} value={novel.id.toString()}>
                      {novel.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Relationship Types */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Relationship Types</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {relationshipTypes.map((type: any) => (
                  <div 
                    key={type.id}
                    className="flex items-center px-3 py-1.5 rounded-full text-white"
                    style={{ backgroundColor: type.color }}
                  >
                    <span className="text-sm">{type.name}</span>
                  </div>
                ))}
                {relationshipTypes.length === 0 && (
                  <p className="text-sm text-gray-500">No custom relationship types defined.</p>
                )}
              </div>
            </div>
            
            {/* Relationship Graph */}
            {!selectedNovelId ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <Link className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <CardTitle className="mb-2">Select a Novel</CardTitle>
                  <CardDescription>
                    Choose a novel from the dropdown above to view its character relationships.
                  </CardDescription>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : characters.length < 2 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <Link className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <CardTitle className="mb-2">No Relationships Available</CardTitle>
                  <CardDescription className="mb-4">
                    You need at least two characters to create relationships. This novel has {characters.length} character(s).
                  </CardDescription>
                  <Button onClick={() => navigate(`/novels/${selectedNovelId}`)}>
                    Go to Novel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <RelationshipGraph 
                  characters={characters}
                  relationships={relationships}
                  relationshipTypes={relationshipTypes}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Add Relationship Dialog */}
      <Dialog open={isAddRelationshipModalOpen} onOpenChange={setIsAddRelationshipModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Relationship</DialogTitle>
          </DialogHeader>
          <RelationshipForm 
            novelId={parseInt(selectedNovelId)}
            characters={characters}
            relationshipTypes={relationshipTypes}
            onSuccess={() => {
              setIsAddRelationshipModalOpen(false);
              queryClient.invalidateQueries({ queryKey: [`/api/novels/${selectedNovelId}/relationships`] });
              toast({
                title: "Relationship added",
                description: "Character relationship has been successfully added",
              });
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Add Relationship Type Dialog */}
      <Dialog open={isAddRelationshipTypeModalOpen} onOpenChange={setIsAddRelationshipTypeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Relationship Type</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const name = (form.elements.namedItem('name') as HTMLInputElement).value;
            const color = (form.elements.namedItem('color') as HTMLInputElement).value;
            handleRelationshipTypeSubmit({ name, color });
          }}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input 
                name="name"
                type="text" 
                required
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Rivals, Colleagues, etc."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-3">
                <input 
                  name="color"
                  type="color" 
                  defaultValue="#6366f1"
                  className="h-10 w-10 border rounded p-1"
                />
                <input 
                  name="colorText"
                  type="text" 
                  defaultValue="#6366f1"
                  className="flex-1 p-2 border rounded-md"
                  onChange={(e) => {
                    const form = e.target.form as HTMLFormElement;
                    const colorInput = form.elements.namedItem('color') as HTMLInputElement;
                    colorInput.value = e.target.value;
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddRelationshipTypeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Type
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
