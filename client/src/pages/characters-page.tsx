import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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
import { User, Edit, Trash2, Eye } from "lucide-react";
import { useLocation } from "wouter";

export default function CharactersPage() {
  const [selectedNovelId, setSelectedNovelId] = useState<string>("all");
  const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
  const [isEditCharacterModalOpen, setIsEditCharacterModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Fetch novels
  const { data: novels = [] } = useQuery({
    queryKey: ["/api/novels"],
  });

  // Fetch characters for selected novel
  const { data: characters = [], isLoading } = useQuery({
    queryKey: [`/api/novels/${selectedNovelId}/characters`],
    enabled: selectedNovelId !== "all",
  });

  // Get all characters across all novels
  const { data: allCharacters = [] } = useQuery({
    queryKey: ["allCharacters"],
    queryFn: async () => {
      const allChars: any[] = [];
      for (const novel of novels) {
        const chars = await queryClient.fetchQuery({
          queryKey: [`/api/novels/${novel.id}/characters`],
        });
        allChars.push(...chars.map((char: any) => ({ ...char, novelTitle: novel.title })));
      }
      return allChars;
    },
    enabled: selectedNovelId === "all" && novels.length > 0,
  });

  // Display characters based on novel selection
  const displayedCharacters = selectedNovelId === "all" ? allCharacters : characters;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="角色" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">角色管理</h3>
              <Button
                onClick={() => setIsAddCharacterModalOpen(true)}
                disabled={novels.length === 0}
              >
                添加角色
              </Button>
            </div>

            {/* Novel selector */}
            <div className="mb-6">
              <Select value={selectedNovelId} onValueChange={setSelectedNovelId}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="选择小说" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有小说</SelectItem>
                  {novels.map((novel: any) => (
                    <SelectItem key={novel.id} value={novel.id.toString()}>
                      {novel.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Characters Grid */}
            {novels.length === 0 ? (
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
            ) : displayedCharacters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedCharacters.map((character: any) => (
                  <Card key={character.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-[1/1] relative bg-gray-100">
                      {character.avatar ? (
                        <img 
                          src={character.avatar} 
                          alt={character.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{character.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {character.description || "未提供描述"}
                      </p>
                      {selectedNovelId === "all" && (
                        <div className="mt-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {character.novelTitle}
                          </span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/novels/${character.novelId}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedCharacter(character);
                          setIsEditCharacterModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
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
        </main>
      </div>

      {/* Add Character Dialog */}
      <Dialog open={isAddCharacterModalOpen} onOpenChange={setIsAddCharacterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新角色</DialogTitle>
          </DialogHeader>
          <CharacterForm 
            mode="create"
            novelId={selectedNovelId !== "all" ? parseInt(selectedNovelId) : undefined}
            novels={novels}
            onSuccess={() => {
              setIsAddCharacterModalOpen(false);
              if (selectedNovelId !== "all") {
                queryClient.invalidateQueries({ queryKey: [`/api/novels/${selectedNovelId}/characters`] });
              } else {
                queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
              }
              toast({
                title: "Character added",
                description: "Character has been successfully added",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Character Dialog */}
      <Dialog open={isEditCharacterModalOpen} onOpenChange={setIsEditCharacterModalOpen}>
        <DialogContent className="max-w-md">
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
              novels={novels}
              onSuccess={() => {
                setIsEditCharacterModalOpen(false);
                setSelectedCharacter(null);
                if (selectedNovelId !== "all") {
                  queryClient.invalidateQueries({ queryKey: [`/api/novels/${selectedNovelId}/characters`] });
                } else {
                  queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
                }
                toast({
                  title: "角色已更新",
                  description: "角色信息已成功更新",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
