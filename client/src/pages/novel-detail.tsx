import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { ObsidianRelationshipGraph } from "@/components/relationship";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Share, MoreHorizontal, BookOpen } from "lucide-react";
import CharacterForm from "@/components/character/character-form";
import CharacterList from "@/components/character/character-list";
import RelationshipForm from "@/components/relationship/relationship-form";
import NovelForm from "@/components/novel/novel-form";

export default function NovelDetail() {
  const [match, params] = useRoute<{ id: string }>("/novels/:id");
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("characters");
  const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
  const [isAddRelationshipModalOpen, setIsAddRelationshipModalOpen] = useState(false);
  const [isEditNovelModalOpen, setIsEditNovelModalOpen] = useState(false);
  
  // 获取小说数据
  const { 
    data: novel,
    isLoading: isNovelLoading,
    isError: isNovelError
  } = useQuery({
    queryKey: [`/api/novels/${params?.id}`],
    enabled: !!params?.id,
  });
  
  // 获取该小说的角色
  const { 
    data: characters = [],
    isLoading: isCharactersLoading,
    refetch: refetchCharacters
  } = useQuery({
    queryKey: [`/api/novels/${params?.id}/characters`],
    enabled: !!params?.id,
  });
  
  // 获取该小说的角色关系
  const { 
    data: relationships = [],
    isLoading: isRelationshipsLoading,
    refetch: refetchRelationships
  } = useQuery({
    queryKey: [`/api/novels/${params?.id}/relationships`],
    enabled: !!params?.id,
  });
  
  // 获取关系类型
  const { 
    data: relationshipTypes = [],
    isLoading: isRelationshipTypesLoading
  } = useQuery({
    queryKey: ["/api/relationship-types"],
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
                    {novel?.author && <p className="text-sm text-gray-500 mt-1 hidden md:block">作者：{novel.author}</p>}
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
                          characters={characters}
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
                          <ObsidianRelationshipGraph 
                            characters={characters}
                            relationships={relationships}
                            relationshipTypes={relationshipTypes}
                            isLoading={isCharactersLoading || isRelationshipsLoading || isRelationshipTypesLoading}
                          />
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
                      <div className="mt-4 bg-gray-50 rounded-lg border border-gray-100 text-center py-12">
                        <h3 className="text-lg font-medium text-gray-400">时间线功能即将推出</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          该功能正在开发中，敬请期待。
                        </p>
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
            characters={characters}
            relationshipTypes={relationshipTypes}
            onSuccess={() => {
              setIsAddRelationshipModalOpen(false);
              refetchRelationships();
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
            onSuccess={() => {
              setIsEditNovelModalOpen(false);
              // 重新获取小说数据以更新UI
              queryClient.invalidateQueries({ queryKey: [`/api/novels/${params?.id}`] });
              toast({
                title: "小说已更新",
                description: "您的小说已成功更新",
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}