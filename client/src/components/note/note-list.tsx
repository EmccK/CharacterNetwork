import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Trash, Plus, User, Tag, CalendarClock } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import NoteForm from "./note-form";

interface Note {
  id: number;
  title: string;
  content: string | null;
  novelId: number;
  characterIds: number[] | null;
  labels: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface Character {
  id: number;
  name: string;
  avatar: string | null;
}

interface NoteListProps {
  notes: Note[];
  novelId: number;
  characters?: Character[];
  isLoading?: boolean;
  onAddNote?: () => void;
  onUpdate?: () => void;
}

export default function NoteList({
  notes,
  novelId,
  characters = [],
  isLoading = false,
  onAddNote,
  onUpdate
}: NoteListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // 删除笔记的mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/novels/${novelId}/notes`] });
      toast({
        title: "笔记已删除",
        description: "笔记已成功删除",
      });
      if (onUpdate) {
        onUpdate();
      }
      setIsDeleteConfirmOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "删除笔记失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddNote = () => {
    setSelectedNote(null);
    setIsFormOpen(true);
  };
  
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsFormOpen(true);
  };
  
  const handleDeleteNote = (note: Note) => {
    setSelectedNote(note);
    setIsDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedNote) {
      deleteNoteMutation.mutate(selectedNote.id);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // 获取角色信息
  const getCharacterById = (id: number) => characters.find(c => c.id === id);
  
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">笔记列表</h3>
        <Button onClick={handleAddNote} size="sm">
          <Plus className="mr-1 h-4 w-4" /> 添加笔记
        </Button>
      </div>
      
      {notes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-gray-100 p-3">
              <CalendarClock className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">暂无笔记</h3>
          <p className="text-xs text-gray-500 mb-4">
            为这本小说添加第一个笔记吧
          </p>
          <Button onClick={handleAddNote} size="sm" variant="outline">
            <Plus className="mr-1 h-4 w-4" /> 添加笔记
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{note.title}</CardTitle>
                <CardDescription className="flex items-center text-xs text-gray-500">
                  <CalendarClock className="mr-1 h-3 w-3" />
                  {formatDate(note.createdAt)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <ScrollArea className="h-24 pr-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {note.content || "无内容"}
                  </p>
                </ScrollArea>
                
                {/* 标签 */}
                {note.labels && note.labels.length > 0 && (
                  <div className="mt-3 flex items-start gap-1">
                    <Tag className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {note.labels.map((label, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs py-0">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 相关角色 */}
                {note.characterIds && note.characterIds.length > 0 && (
                  <div className="mt-3 flex items-start gap-1">
                    <User className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {note.characterIds.map((charId) => {
                        const character = getCharacterById(charId);
                        return character ? (
                          <div key={charId} className="flex items-center mr-2">
                            <Avatar className="h-4 w-4 mr-1">
                              {character.avatar ? (
                                <AvatarImage src={character.avatar} alt={character.name} />
                              ) : (
                                <AvatarFallback className="text-[8px]">
                                  {character.name[0]}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-xs">{character.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-end gap-2">
                <Button 
                  onClick={() => handleEditNote(note)} 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => handleDeleteNote(note)} 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* 添加/编辑笔记对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNote ? "编辑笔记" : "添加笔记"}</DialogTitle>
          </DialogHeader>
          <NoteForm
            novelId={novelId}
            initialData={selectedNote || undefined}
            characters={characters}
            onSuccess={() => {
              setIsFormOpen(false);
              if (onUpdate) {
                onUpdate();
              }
              toast({
                title: selectedNote ? "笔记已更新" : "笔记已添加",
                description: selectedNote ? "笔记已成功更新" : "笔记已成功添加",
              });
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个笔记吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 