import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Character } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditIcon, Eye, Trash2, User, Plus } from "lucide-react";
import { useLocation } from "wouter";
import CharacterForm from "./character-form";

interface CharacterListProps {
  characters: Character[];
  isLoading: boolean;
  novelId: number;
  onAddCharacter: () => void;
  onUpdate: () => void;
}

export default function CharacterList({ 
  characters, 
  isLoading, 
  novelId,
  onAddCharacter,
  onUpdate
}: CharacterListProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);
  
  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/characters/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Character deleted",
        description: "The character has been successfully deleted",
      });
      setCharacterToDelete(null);
      onUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete character",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = () => {
    if (characterToDelete) {
      deleteCharacterMutation.mutate(characterToDelete.id);
    }
  };
  
  const handleEditClick = (character: Character) => {
    setCharacterToEdit(character);
    setIsEditDialogOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Characters</h3>
        <Button variant="outline" size="sm" onClick={onAddCharacter}>
          <Plus className="h-4 w-4 mr-1" /> Add Character
        </Button>
      </div>
      
      {characters.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <User className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No characters yet</h3>
          <p className="text-gray-500 mb-4">Start by adding characters to your novel</p>
          <Button onClick={onAddCharacter}>
            <Plus className="h-4 w-4 mr-1" /> Add Character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <Card key={character.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                  {character.avatar ? (
                    <AvatarImage src={character.avatar} alt={character.name} />
                  ) : (
                    <AvatarFallback className="bg-primary-100 text-primary-800">
                      {character.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{character.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-600">
                  {character.description || "No description provided."}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-1 pt-0">
                <Button variant="ghost" size="sm" onClick={() => handleEditClick(character)}>
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCharacterToDelete(character)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!characterToDelete} onOpenChange={(open) => !open && setCharacterToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the character "{characterToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCharacterToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit character dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
          </DialogHeader>
          {characterToEdit && (
            <CharacterForm
              initialData={characterToEdit}
              novelId={novelId}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                onUpdate();
                toast({
                  title: "Character updated",
                  description: "Character has been successfully updated",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
