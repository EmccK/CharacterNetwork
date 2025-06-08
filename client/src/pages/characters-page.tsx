import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CharacterForm from "@/components/character/character-form";
import { User, Edit, Trash2, Eye, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function CharactersPage() {
  const [selectedNovelId, setSelectedNovelId] = useState<string>("all");
  const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
  const [isEditCharacterModalOpen, setIsEditCharacterModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [characterToDelete, setCharacterToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // 删除角色的mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      await apiRequest("DELETE", `/api/characters/${characterId}`);
    },
    onSuccess: () => {
      // 刷新当前选中小说的角色
      if (selectedNovelId !== "all") {
        queryClient.invalidateQueries({ queryKey: [`/api/novels/${selectedNovelId}/characters`] });
      } else {
        // 如果是"所有小说"视图，则直接手动刷新
        refetchAllCharacters();
      }
      
      // 刷新所有角色统计信息
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
      
      // 刷新所有关系（因为删除角色会级联删除所有相关的关系）
      queryClient.invalidateQueries({ queryKey: ["allRelationships"] });
      
      toast({
        title: "角色已删除",
        description: "角色已成功删除"
      });
      
      setIsDeleteModalOpen(false);
      setCharacterToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "删除角色失败",
        description: error.message,
        variant: "destructive"
      });
      setIsDeleteModalOpen(false);
    }
  });

  // 处理删除角色
  const handleDeleteCharacter = (characterId: number) => {
    setCharacterToDelete(characterId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCharacter = () => {
    if (characterToDelete) {
      deleteCharacterMutation.mutate(characterToDelete);
    }
  };

  // 处理选择小说更改
  const handleNovelChange = (novelId: string) => {
    setSelectedNovelId(novelId);
    // 如果切换到"所有小说"，强制刷新
    if (novelId === "all") {
      refetchAllCharacters();
    }
  };

  // Fetch novels
  const { data: novels = [] } = useQuery({
    queryKey: ["/api/novels"],
    queryFn: () => fetch("/api/novels", { credentials: "include" }).then(res => res.json()),
  });

  // Fetch characters for selected novel
  const { data: characters = [], isLoading } = useQuery({
    queryKey: [`/api/novels/${selectedNovelId}/characters`],
    queryFn: () => fetch(`/api/novels/${selectedNovelId}/characters`, { credentials: "include" }).then(res => res.json()),
    enabled: selectedNovelId !== "all",
  });

  // Get all characters across all novels
  const { data: allCharacters = [], refetch: refetchAllCharacters } = useQuery({
    queryKey: ["allCharacters", (novels as any[]).length], // 添加novels.length作为依赖项
    queryFn: async () => {
      console.log("获取所有小说的角色", (novels as any[]).map((n: any) => n.title));
      const allChars: any[] = [];
      for (const novel of (novels as any[])) {
        try {
          // 使用fetch而不是fetchQuery以避免缓存问题
          const response = await fetch(`/api/novels/${novel.id}/characters`, {
            credentials: "include"
          });
          if (!response.ok) {
            console.error(`获取小说 ${novel.id} 的角色失败`);
            continue;
          }
          const chars = await response.json();
          // 确保添加novelTitle
          const charsWithTitle = chars.map((char: any) => ({
            ...char,
            novelTitle: novel.title || `小说 #${novel.id}`
          }));
          allChars.push(...charsWithTitle);
        } catch (error) {
          console.error(`获取小说 ${novel.id} 的角色时出错:`, error);
        }
      }
      return allChars;
    },
    enabled: selectedNovelId === "all" && (novels as any[]).length > 0,
    refetchOnMount: true, // 确保每次挂载都刷新
    refetchOnWindowFocus: true, // 当窗口获得焦点时刷新
  });

  // Display characters based on novel selection
  const displayedCharacters = selectedNovelId === "all" ? allCharacters : characters;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">角色管理</h3>
          <Button
            onClick={() => setIsAddCharacterModalOpen(true)}
            disabled={(novels as any[]).length === 0}
          >
            添加角色
          </Button>
        </div>

        {/* Novel selector */}
        <div className="mb-6">
          <Select value={selectedNovelId} onValueChange={handleNovelChange}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="选择小说" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有小说</SelectItem>
              {(novels as any[]).map((novel: any) => (
                <SelectItem key={novel.id} value={novel.id.toString()}>
                  {novel.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Characters Grid */}
        {(novels as any[]).length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-4">您需要先创建小说再添加角色。</p>
              <Button onClick={() => navigate("/novels")}>
                创建小说
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (displayedCharacters as any[]).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(displayedCharacters as any[]).map((character: any) => (
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
                  {selectedNovelId === "all" && character.novelTitle && (
                    <div className="mt-1 text-center">
                      <span className="text-xs bg-gray-50 px-2 py-0.5 rounded-full">
                        {character.novelTitle}
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-center gap-2 pt-0 pb-2 px-3 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 rounded-full bg-white hover:bg-white hover:text-blue-600" 
                    onClick={() => navigate(`/novels/${character.novelId}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 rounded-full bg-white hover:bg-white hover:text-primary-600" 
                    onClick={() => {
                      setSelectedCharacter(character);
                      setIsEditCharacterModalOpen(true);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-full bg-white hover:bg-white hover:text-red-600"
                    onClick={() => handleDeleteCharacter(character.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="flex justify-center">
              <div className="bg-gray-100 p-3 rounded-full">
                <User className="h-10 w-10 text-gray-400" />
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">未找到角色</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedNovelId === "all" 
                ? "您在任何小说中都还没有创建角色。" 
                : "这部小说还没有任何角色。"}
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsAddCharacterModalOpen(true)}>
                添加角色
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Character Dialog */}
      <Dialog open={isAddCharacterModalOpen} onOpenChange={setIsAddCharacterModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 scale-in">
          <DialogHeader>
            <DialogTitle>添加新角色</DialogTitle>
          </DialogHeader>
          <CharacterForm 
            mode="create"
            novelId={selectedNovelId !== "all" ? parseInt(selectedNovelId) : undefined}
            novels={novels as any[]}
            onSuccess={() => {
              setIsAddCharacterModalOpen(false);
              // 刷新当前选中小说的角色
              if (selectedNovelId !== "all") {
                queryClient.invalidateQueries({ queryKey: [`/api/novels/${selectedNovelId}/characters`] });
              } else {
                // 如果是"所有小说"视图，则直接手动刷新
                refetchAllCharacters();
              }
              
              // 刷新所有角色统计信息
              queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
              
              // 刷新关系计数
              queryClient.invalidateQueries({ queryKey: ["allRelationships"] });
              
              toast({
                title: "角色已添加",
                description: "角色已成功添加"
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Character Dialog */}
      <Dialog open={isEditCharacterModalOpen} onOpenChange={setIsEditCharacterModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 scale-in">
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
          </DialogHeader>
          {selectedCharacter && (
            <CharacterForm 
              mode="update"
              characterId={selectedCharacter.id}
              initialData={{
                name: selectedCharacter.name,
                description: selectedCharacter.description,
                novelId: selectedCharacter.novelId,
                avatar: selectedCharacter.avatar
              }}
              novelId={selectedCharacter.novelId}
              novels={novels as any[]}
              onSuccess={() => {
                setIsEditCharacterModalOpen(false);
                setSelectedCharacter(null);
                
                // 刷新当前选中小说的角色
                if (selectedNovelId !== "all") {
                  queryClient.invalidateQueries({ queryKey: [`/api/novels/${selectedNovelId}/characters`] });
                } else {
                  // 如果是"所有小说"视图，则直接手动刷新
                  refetchAllCharacters();
                }
                
                // 刷新所有角色统计信息
                queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
                
                // 刷新关系计数
                queryClient.invalidateQueries({ queryKey: ["allRelationships"] });
                
                toast({
                  title: "角色已更新",
                  description: "角色信息已成功更新"
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Character Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="text-amber-500 mr-2 h-5 w-5" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              您确定要删除这个角色吗？该操作将同时删除与此角色相关的所有关系，且无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setCharacterToDelete(null);
              }}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCharacter}
              disabled={deleteCharacterMutation.isPending}
            >
              {deleteCharacterMutation.isPending ? "删除中..." : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
