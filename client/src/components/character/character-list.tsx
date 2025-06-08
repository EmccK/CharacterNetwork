import React, { useState } from "react";
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
      const response = await apiRequest("DELETE", `/api/characters/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "角色已删除",
        description: "角色已成功删除",
      });
      setCharacterToDelete(null);
      onUpdate();
      
      // 刷新侧边栏计数
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
      queryClient.invalidateQueries({ queryKey: ["allRelationships"] });
    },
    onError: (error: Error) => {
      toast({
        title: "删除角色失败",
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
  
  // 调试日志，查看角色头像数据
  React.useEffect(() => {
    if (characters && characters.length > 0) {
      console.log('Character avatars:', characters.map(c => ({ 
        name: c.name, 
        avatar: c.avatar ? (c.avatar.length > 100 ? `${c.avatar.substring(0, 100)}...` : c.avatar) : null 
      })));
    }
  }, [characters]);
  
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
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">小说角色</h3>
          <span className="text-sm bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
            {characters.length} 个角色
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddCharacter}
          className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Plus className="h-4 w-4 mr-1 text-primary-500" /> 添加角色
        </Button>
      </div>
      
      {characters.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <User className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">暂无角色</h3>
          <p className="text-gray-500 mb-4">开始为您的小说添加角色</p>
          <Button onClick={onAddCharacter}>
            <Plus className="h-4 w-4 mr-1" /> 添加角色
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {characters.map((character) => (
            <Card 
              key={character.id} 
              className="overflow-hidden hover:shadow-md transition-all hover:border-primary-200 group bg-white min-h-[140px]"
            >
              <CardHeader className="pb-1 pt-3 px-3">
                <div className="flex flex-col items-center text-center w-full">
                  <Avatar className="h-12 w-12 mb-2 ring-2 ring-gray-50 group-hover:ring-primary-50">
                    {character.avatar ? (
                      character.avatar.startsWith('data:image/svg+xml;base64,') ? (
                        <div className="w-full h-full">
                          <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <AvatarImage src={character.avatar} alt={character.name} />
                      )
                    ) : (
                      <AvatarFallback className="bg-primary-100 text-primary-800">
                        {character.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <CardTitle className="text-sm font-medium w-full px-1 whitespace-normal break-words" title={character.name}>
                    {character.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-2 px-3">
                <p className="text-xs text-gray-600 line-clamp-2 text-center">
                  {character.description || "暂无描述。"}
                </p>
              </CardContent>
              <CardFooter className="flex justify-center gap-2 pt-0 pb-2 px-3 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 rounded-full bg-white hover:bg-white hover:text-primary-600" 
                  onClick={() => handleEditClick(character)}
                >
                  <EditIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full bg-white hover:bg-white hover:text-red-600"
                  onClick={() => setCharacterToDelete(character)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除角色 "{characterToDelete?.name}" 吗？此操作无法撤消。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCharacterToDelete(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit character dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
          </DialogHeader>
          {characterToEdit && (
            <CharacterForm
              mode="update"
              characterId={characterToEdit.id}
              initialData={{
                ...characterToEdit,
                avatar: characterToEdit?.avatar || undefined
              }}
              novelId={novelId}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                onUpdate();
                
                // 刷新侧边栏计数
                queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
                
                toast({
                  title: "角色已更新",
                  description: "角色已成功更新",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
