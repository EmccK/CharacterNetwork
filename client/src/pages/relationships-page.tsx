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
import { CharacterNetworkGraph } from "@/components/relationship";
import { Link, Plus, PenSquare, Trash } from "lucide-react";
import { useLocation } from "wouter";

export default function RelationshipsPage() {
  const [selectedNovelId, setSelectedNovelId] = useState<string>("");
  const [isAddRelationshipModalOpen, setIsAddRelationshipModalOpen] = useState(false);
  const [isAddRelationshipTypeModalOpen, setIsAddRelationshipTypeModalOpen] = useState(false);
  const [isEditRelationshipTypeModalOpen, setIsEditRelationshipTypeModalOpen] = useState(false);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<any>(null);
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
        title: "关系类型已添加",
        description: "关系类型已成功添加",
      });
    } catch (error: any) {
      toast({
        title: "添加关系类型失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRelationshipTypeEdit = async (data: any) => {
    try {
      await apiRequest("PUT", `/api/relationship-types/${selectedRelationshipType.id}`, {
        name: data.name,
        color: data.color,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/relationship-types"] });
      setIsEditRelationshipTypeModalOpen(false);
      setSelectedRelationshipType(null);
      toast({
        title: "关系类型已更新",
        description: "关系类型已成功更新",
      });
    } catch (error: any) {
      toast({
        title: "更新关系类型失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRelationshipTypeDelete = async (typeId: number) => {
    // 检查是否有使用此关系类型的关系
    const relationshipsUsingType = relationships.filter((rel: any) => rel.typeId === typeId);
    
    if (relationshipsUsingType.length > 0) {
      toast({
        title: "无法删除关系类型",
        description: `有 ${relationshipsUsingType.length} 个关系正在使用此类型。请先删除这些关系。`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/relationship-types/${typeId}`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/relationship-types"] });
      toast({
        title: "关系类型已删除",
        description: "关系类型已成功删除",
      });
    } catch (error: any) {
      toast({
        title: "删除关系类型失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="关系" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">角色关系</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddRelationshipTypeModalOpen(true)}
                >
                  <PenSquare className="h-4 w-4 mr-2" /> 添加关系类型
                </Button>
                <Button
                  onClick={() => setIsAddRelationshipModalOpen(true)}
                  disabled={!selectedNovelId || characters.length < 2}
                >
                  <Plus className="h-4 w-4 mr-2" /> 添加关系
                </Button>
              </div>
            </div>

            {/* Novel selector */}
            <div className="mb-6">
              <Select value={selectedNovelId} onValueChange={setSelectedNovelId}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="选择小说查看关系" />
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
              <h4 className="text-md font-medium mb-2">关系类型</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {relationshipTypes.map((type: any) => {
                  // 检查是否有使用此关系类型的关系
                  const isUsedInRelationships = relationships.some((rel: any) => rel.typeId === type.id);
                  
                  return (
                    <div 
                      key={type.id}
                      className="group flex items-center px-3 py-1.5 rounded-full text-white relative"
                      style={{ backgroundColor: type.color }}
                    >
                      <span className="text-sm">{type.name}</span>
                      <div className="absolute right-[-6px] top-[-6px] opacity-0 group-hover:opacity-100 flex bg-white rounded-full shadow-sm">
                        <button 
                          onClick={() => {
                            setSelectedRelationshipType(type);
                            setIsEditRelationshipTypeModalOpen(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-l-full"
                          title="编辑关系类型"
                        >
                          <PenSquare className="h-3 w-3 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => handleRelationshipTypeDelete(type.id)}
                          className={`p-1 hover:bg-gray-100 rounded-r-full ${isUsedInRelationships ? 'cursor-not-allowed opacity-50' : ''}`}
                          title={isUsedInRelationships ? "此类型正在被使用，无法删除" : "删除关系类型"}
                          disabled={isUsedInRelationships}
                        >
                          <Trash className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {relationshipTypes.length === 0 && (
                  <p className="text-sm text-gray-500">没有定义自定义关系类型。</p>
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
                  <CardTitle className="mb-2">选择小说</CardTitle>
                  <CardDescription>
                    从上面的下拉菜单中选择一部小说来查看其角色关系。
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
                  <CardTitle className="mb-2">没有可用的关系</CardTitle>
                  <CardDescription className="mb-4">
                    您需要至少两个角色才能创建关系。这部小说有 {characters.length} 个角色。
                  </CardDescription>
                  <Button onClick={() => navigate(`/novels/${selectedNovelId}`)}>
                    前往小说
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <>
                  <CharacterNetworkGraph 
                    characters={characters}
                    relationships={relationships}
                    relationshipTypes={relationshipTypes}
                    isLoading={isLoading}
                    onSelectCharacter={(character) => {
                      // 选中角色后可以在相应的信息区域显示角色信息
                      // 而不是使用toast
                      if (character) {
                        console.log(`选中了角色：${character.name}`);
                      }
                    }}
                  />
                </>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Relationship Dialog */}
      <Dialog open={isAddRelationshipModalOpen} onOpenChange={setIsAddRelationshipModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新关系</DialogTitle>
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
            <DialogTitle>添加关系类型</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const name = (form.elements.namedItem('name') as HTMLInputElement).value;
            const color = (form.elements.namedItem('color') as HTMLInputElement).value;
            handleRelationshipTypeSubmit({ name, color });
          }}>
            <div className="space-y-2">
              <label className="text-sm font-medium">名称</label>
              <input 
                name="name"
                type="text" 
                required
                className="w-full p-2 border rounded-md"
                placeholder="例如：竞争对手、同事等。"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">颜色</label>
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
                取消
              </Button>
              <Button type="submit">
                添加类型
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Relationship Type Dialog */}
      <Dialog open={isEditRelationshipTypeModalOpen} onOpenChange={(open) => {
        setIsEditRelationshipTypeModalOpen(open);
        if (!open) setSelectedRelationshipType(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑关系类型</DialogTitle>
          </DialogHeader>
          {selectedRelationshipType && (
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              const color = (form.elements.namedItem('color') as HTMLInputElement).value;
              handleRelationshipTypeEdit({ name, color });
            }}>
              <div className="space-y-2">
                <label className="text-sm font-medium">名称</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  defaultValue={selectedRelationshipType.name}
                  className="w-full p-2 border rounded-md"
                  placeholder="例如：竞争对手、同事等。"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">颜色</label>
                <div className="flex gap-3">
                  <input 
                    name="color"
                    type="color" 
                    defaultValue={selectedRelationshipType.color}
                    className="h-10 w-10 border rounded p-1"
                  />
                  <input 
                    name="colorText"
                    type="text" 
                    defaultValue={selectedRelationshipType.color}
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
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditRelationshipTypeModalOpen(false);
                  setSelectedRelationshipType(null);
                }}>
                  取消
                </Button>
                <Button type="submit">
                  保存修改
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
