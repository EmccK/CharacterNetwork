import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { CharacterNetworkGraph } from "@/components/relationship";
import { TimelineView } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Share, MoreHorizontal, BookOpen, Trash, Link } from "lucide-react";
import CharacterForm from "@/components/character/character-form";
import CharacterList from "@/components/character/character-list";
import RelationshipForm from "@/components/relationship/relationship-form";
import NovelForm from "@/components/novel/novel-form";

interface Novel {
  title: string;
  coverImage: string;
  genre: string;
  updatedAt: string;
  description: string;
  author?: string;
  status: string;
  bookInfoId?: number;
  bookInfo?: {
    author?: string;
  };
}

interface Character {
  id: number;
  name: string;
  novelId: number;
  description: string | null;
  avatar: string | null;
  createdAt: string;
}

interface Relationship {
  id: number;
  novelId: number;
  description: string | null;
  sourceId: number;
  targetId: number;
  typeId: number;
}

interface TimelineEvent {
  id: number;
  title: string;
  description: string | null;
  date: string;
  importance: string;
  characterIds: number[];
  novelId: number;
  createdAt: string;
}

interface RelationshipType {
  id: number;
  color: string;
  name: string;
  userId: number;
}
export default function NovelDetail() {
  const [match, params] = useRoute<{ id: string }>("/novels/:id");
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("characters");
  const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
  const [isAddRelationshipModalOpen, setIsAddRelationshipModalOpen] = useState(false);
  const [isEditNovelModalOpen, setIsEditNovelModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [relationshipToDelete, setRelationshipToDelete] = useState<number | null>(null);
  
  // 获取小说数据
  const {
    data: novel,
    isLoading: isNovelLoading,
    isError: isNovelError
  } = useQuery<Novel>({
    queryKey: [`/api/novels/${params?.id}`],
    enabled: !!params?.id,
  });
  
  // 获取该小说的角色
  const {
    data: characters = [],
    isLoading: isCharactersLoading,
    refetch: refetchCharacters
  } = useQuery<Character[]>({
    queryKey: [`/api/novels/${params?.id}/characters`],
    enabled: !!params?.id,
  });
  
  const parsedCharacters = characters.map((c: Character) => ({ ...c, createdAt: new Date(c.createdAt) }));
  
  // 获取该小说的角色关系
  const {
    data: relationships = [],
    isLoading: isRelationshipsLoading,
    refetch: refetchRelationships
  } = useQuery<Relationship[]>({
    queryKey: [`/api/novels/${params?.id}/relationships`],
    enabled: !!params?.id,
  });
  
  // 获取关系类型
  const {
    data: relationshipTypes = [],
    isLoading: isRelationshipTypesLoading
  } = useQuery<RelationshipType[]>({
    queryKey: ["/api/relationship-types"],
    enabled: !!params?.id,
  });
  
  // 获取该小说的时间线事件
  const {
    data: timelineEvents = [],
    isLoading: isTimelineEventsLoading,
    refetch: refetchTimelineEvents
  } = useQuery<TimelineEvent[]>({
    queryKey: [`/api/novels/${params?.id}/timeline-events`],
    enabled: !!params?.id,
  });
  
  // 如果没有匹配，重定向到小说页面
  useEffect(() => {
    if (!match) {
      navigate("/novels");
    }
  }, [match, navigate]);
  
  if (isNovelLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar title="小说详情" />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (isNovelError || !novel) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar title="小说详情" />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">未找到小说</h3>
              <p className="mt-2 text-sm text-gray-500">
                您查找的小说不存在或您没有查看权限。
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate("/novels")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> 返回小说列表
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={novel?.title || "小说详情"} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {/* 返回按钮和标题栏 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/novels")}>
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">《{novel?.title || "小说"}》详情</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditNovelModalOpen(true)}>
                <Edit className="mr-1 h-4 w-4" /> 编辑
              </Button>
              <Button variant="outline" size="sm">
                <Share className="mr-1 h-4 w-4" /> 分享
              </Button>
            </div>
          </div>
          
          {/* 主要内容卡片 */}
          <div className="mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
            {/* 小说封面背景 */}
            <div className="h-40 bg-gradient-to-r from-primary-100 to-primary-50 relative overflow-hidden">
              {novel.coverImage && (
                <div className="absolute inset-0 w-full h-full opacity-20 blur-sm">
                  <img src={novel.coverImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent"></div>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-start gap-6 relative">
                {/* 小说封面 */}
                <div className="w-32 md:w-40 lg:w-48 -mt-20 md:-mt-24 z-10 mx-auto md:mx-0">
                  <div className="rounded-lg overflow-hidden bg-gray-200 w-full shadow-lg" style={{ aspectRatio: '128/185' }}>
                    {novel.coverImage ? (
                      <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <BookOpen className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* 小说详细信息 */}
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 md:gap-y-3 text-sm">
                    <h4 className="font-medium text-gray-500">类型</h4>
                    <span className="text-gray-800 font-medium">
                      {novel && novel.genre ? novel.genre : "未指定"}
                    </span>
                    
                    <h4 className="font-medium text-gray-500">角色</h4>
                    <span className="text-gray-800 font-medium">{Array.isArray(characters) ? characters.length : 0} 个</span>
                    
                    <h4 className="font-medium text-gray-500">关系</h4>
                    <span className="text-gray-800 font-medium">{Array.isArray(relationships) ? relationships.length : 0} 个</span>
                    
                    <h4 className="font-medium text-gray-500">更新</h4>
                    <span className="text-gray-800">
                      {novel && novel.updatedAt ? new Date(novel.updatedAt).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </div>
                
                {/* 小说描述和标签页 */}
                <div className="flex-1 md:pl-2">
                  <div className="md:mt-2">
                    <h2 className="text-2xl font-bold text-gray-900 hidden md:block">{novel?.title || "小说"}</h2>
                    {(novel?.bookInfo?.author || novel?.author) && (
                      <p className="text-sm text-gray-500 mt-1">
                        作者：{novel?.bookInfo?.author || novel?.author}
                      </p>
                    )}
                    <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h3 className="font-medium text-gray-700 mb-1">作品简介</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {novel?.description || "暂无描述信息。"}
                      </p>
                    </div>
                  </div>
                  
                  {/* 选项卡 */}
                  <div className="mt-6 border-b border-gray-200">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="border-b-0">
                        <TabsTrigger value="characters">角色</TabsTrigger>
                        <TabsTrigger value="relationships">关系图</TabsTrigger>
                        <TabsTrigger value="notes">笔记</TabsTrigger>
                        <TabsTrigger value="timeline">时间线</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  {/* 选项卡内容 */}
                  <div className="mt-6">
                    {activeTab === "characters" && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">小说角色</h3>
                        <CharacterList 
                          characters={parsedCharacters}
                          isLoading={isCharactersLoading}
                          novelId={parseInt(params?.id || "0")}
                          onAddCharacter={() => setIsAddCharacterModalOpen(true)}
                          onUpdate={() => refetchCharacters()}
                        />
                      </div>
                    )}
                  
                    {activeTab === "relationships" && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">角色关系图</h3>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setIsAddCharacterModalOpen(true)}
                            >
                              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg> 
                              添加角色
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => setIsAddRelationshipModalOpen(true)}
                              disabled={characters.length < 2}
                            >
                              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg> 
                              添加关系
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden p-1">
                          <CharacterNetworkGraph 
                            characters={parsedCharacters}
                            relationships={relationships}
                            relationshipTypes={relationshipTypes}
                            isLoading={isCharactersLoading || isRelationshipsLoading || isRelationshipTypesLoading}
                            onSelectCharacter={(character) => {
                              if (character) {
                                // 使用非弹出的方式显示角色信息，
                                // 如切换到角色信息页面或更新状态栏
                                // 这里可以不显示任何通知
                                console.log(`已选择角色：${character.name}`);
                              }
                            }}
                          />
                          
                          {/* 关系列表 */}
                          {relationships.length > 0 && (
                            <div className="mt-4 bg-white p-4 rounded-lg border border-gray-100">
                              <h4 className="text-md font-medium mb-2">已有关系</h4>
                              <div className="grid gap-2">
                                {relationships.map((relationship: any) => {
                                  const source = characters.find((c: any) => c.id === relationship.sourceId);
                                  const target = characters.find((c: any) => c.id === relationship.targetId);
                                  const relType = relationshipTypes.find((t: any) => t.id === relationship.typeId);
                                  
                                  if (!source || !target || !relType) return null;
                                  
                                  return (
                                    <div key={relationship.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-gray-100">
                                      <div className="flex items-center">
                                        <strong className="mr-2">{source.name}</strong>
                                        <span 
                                          className="px-2 py-0.5 rounded text-xs text-white mx-2"
                                          style={{ backgroundColor: relType.color }}
                                        >
                                          {relType.name}
                                        </span>
                                        <strong>{target.name}</strong>
                                        {relationship.description && (
                                          <span className="ml-2 text-sm text-gray-500">
                                            - {relationship.description}
                                          </span>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-500 hover:text-red-500"
                                        onClick={() => {
                                          setRelationshipToDelete(relationship.id);
                                          setIsDeleteConfirmOpen(true);
                                        }}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* 关系为空状态 */}
                          {relationships.length === 0 && characters.length >= 2 && (
                            <div className="mt-4 bg-white p-6 rounded-lg border border-gray-100 text-center">
                              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                                <Link className="h-6 w-6 text-gray-500" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-1">还没有角色关系</h3>
                              <p className="text-gray-500 mb-4">创建角色之间的关系来构建关系网络</p>
                              <Button 
                                onClick={() => setIsAddRelationshipModalOpen(true)}
                                disabled={characters.length < 2}
                              >
                                添加第一个关系
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  
                    {activeTab === "notes" && (
                      <div className="mt-4 bg-gray-50 rounded-lg border border-gray-100 text-center py-12">
                        <h3 className="text-lg font-medium text-gray-400">笔记功能即将推出</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          该功能正在开发中，敬请期待。
                        </p>
                      </div>
                    )}
                    
                    {activeTab === "timeline" && (
                      <div className="mt-4">
                        <TimelineView
                          events={timelineEvents}
                          characters={parsedCharacters}
                          novelId={parseInt(params?.id || "0")}
                          isLoading={isTimelineEventsLoading}
                          onUpdate={() => refetchTimelineEvents()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* 添加角色弹窗 */}
      <Dialog open={isAddCharacterModalOpen} onOpenChange={setIsAddCharacterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新角色</DialogTitle>
          </DialogHeader>
          <CharacterForm 
            mode="create"
            novelId={parseInt(params?.id || "0")}
            onSuccess={() => {
              setIsAddCharacterModalOpen(false);
              refetchCharacters();
              
              // 刷新侧边栏计数
              queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
              queryClient.invalidateQueries({ queryKey: ["allRelationships"] });
              
              toast({
                title: "角色已添加",
                description: "角色已成功添加到您的小说中",
              });
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* 添加关系弹窗 */}
      <Dialog open={isAddRelationshipModalOpen} onOpenChange={setIsAddRelationshipModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新关系</DialogTitle>
          </DialogHeader>
          <RelationshipForm 
            novelId={parseInt(params?.id || "0")}
            characters={parsedCharacters}
            relationships={relationships}
            relationshipTypes={relationshipTypes}
            onSuccess={() => {
              setIsAddRelationshipModalOpen(false);
              refetchRelationships();
              
              // 刷新侧边栏计数
              queryClient.invalidateQueries({ queryKey: ["allRelationships"] });
              
              toast({
                title: "关系已添加",
                description: "关系已成功添加",
              });
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* 编辑小说弹窗 */}
      <Dialog open={isEditNovelModalOpen} onOpenChange={setIsEditNovelModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑小说</DialogTitle>
          </DialogHeader>
          <NovelForm 
            initialData={{
              id: parseInt(params?.id || "0"),
              title: novel?.title || "",
              description: novel?.description || "",
              genre: novel?.genre || "",
              status: novel?.status || "In Progress",
              coverImage: novel?.coverImage || ""
            }}
            key={novel?.id} // 添加key属性，确保小说变化时表单重新初始化
            onSuccess={() => {
              setIsEditNovelModalOpen(false);
              // 重新获取小说数据以更新UI
              queryClient.invalidateQueries({ queryKey: [`/api/novels/${params?.id}`] });
              // 同时刷新小说列表，确保其他页面引用的小说名称也能更新
              queryClient.invalidateQueries({ queryKey: ["/api/novels"] });
              toast({
                title: "小说已更新",
                description: "您的小说已成功更新",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 删除关系确认对话框 */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这个角色关系吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (relationshipToDelete) {
                  try {
                    await apiRequest("DELETE", `/api/relationships/${relationshipToDelete}`, {});
                    refetchRelationships();
                    
                    // 刷新侧边栏计数
                    queryClient.invalidateQueries({ queryKey: ["allRelationships"] });
                    
                    toast({
                      title: "关系已删除",
                      description: "角色关系已成功删除",
                    });
                  } catch (error: any) {
                    toast({
                      title: "删除关系失败",
                      description: error.message || "删除角色关系时发生错误",
                      variant: "destructive",
                    });
                  } finally {
                    setIsDeleteConfirmOpen(false);
                    setRelationshipToDelete(null);
                  }
                }
              }}
            >
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}