import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryClient, getRequest } from "@/lib/queryClient";
import { BookOpen, Users, Link as LinkIcon, BookMarked, ArrowRight } from "lucide-react";

import { CardGrid } from "@/components/ui/card-grid";
import { MobileCard } from "@/components/ui/mobile-card";
import { useIsMobile } from "@/hooks/use-mobile";

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Get novels count
  const { data: novels = [] } = useQuery<any[]>({
    queryKey: ["/api/novels"],
  });

  // 获取所有角色总数
  const [charactersCount, setCharactersCount] = useState(0);
  const [relationshipsCount, setRelationshipsCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);

  useEffect(() => {
    // 获取所有角色总数
    getRequest("/api/characters/count").then((response: any) => {
      setCharactersCount(response.count || 0);
    });

    // 获取所有关系总数
    getRequest("/api/relationships/count").then((response: any) => {
      setRelationshipsCount(response.count || 0);
    });

    // 获取进行中的小说
    getRequest("/api/novels/count?status=in_progress").then((response: any) => {
      setInProgressCount(response.count || 0);
    });
  }, []);

  // 刷新函数
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/novels"] });
    
    // 重新获取统计数据
    getRequest("/api/characters/count").then((response: any) => {
      setCharactersCount(response.count || 0);
    });

    getRequest("/api/relationships/count").then((response: any) => {
      setRelationshipsCount(response.count || 0);
    });

    getRequest("/api/novels/count?status=in_progress").then((response: any) => {
      setInProgressCount(response.count || 0);
    });
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <img src="/icons/icon-universal.svg" alt="小说人物关系" className="h-12 w-12 mr-3" />
          <div>
            <h1 className="text-2xl font-bold">欢迎，{user?.username}！</h1>
            <p className="text-gray-600">在一处管理您的小说、角色和它们的关系。</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <Card className="bounce-in" style={{ animationDelay: '0.05s' }}>
          <CardContent className="p-4 sm:p-6 flex items-center">
            <div className="bg-primary-100 p-2 sm:p-3 rounded-full mr-2 sm:mr-4">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">小说总数</p>
              <h3 className="text-xl sm:text-2xl font-bold">{novels.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bounce-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-4 sm:p-6 flex items-center">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full mr-2 sm:mr-4">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">角色</p>
              <h3 className="text-xl sm:text-2xl font-bold">{charactersCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bounce-in" style={{ animationDelay: '0.15s' }}>
          <CardContent className="p-4 sm:p-6 flex items-center">
            <div className="bg-green-100 p-2 sm:p-3 rounded-full mr-2 sm:mr-4">
              <LinkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">关系</p>
              <h3 className="text-xl sm:text-2xl font-bold">{relationshipsCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bounce-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-4 sm:p-6 flex items-center">
            <div className="bg-amber-100 p-2 sm:p-3 rounded-full mr-2 sm:mr-4">
              <BookMarked className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">进行中</p>
              <h3 className="text-xl sm:text-2xl font-bold">{inProgressCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-full mr-2">
            <LinkIcon className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">快捷操作</h2>
        </div>
        
        {isMobile ? (
          <div className="space-y-3">
            <MobileCard
              title="创建新小说"
              subtitle="在您的收藏中添加新小说"
              leading={<div className="p-2 bg-primary-100 rounded-full"><BookOpen className="h-5 w-5 text-primary-600" /></div>}
              hasArrow
              onClick={() => navigate("/novels")}
            />
            
            <MobileCard
              title="管理角色"
              subtitle="查看和编辑您的角色名单"
              leading={<div className="p-2 bg-blue-100 rounded-full"><Users className="h-5 w-5 text-blue-600" /></div>}
              hasArrow
              onClick={() => navigate("/characters")}
            />
            
            <MobileCard
              title="可视化关系"
              subtitle="探索角色联系"
              leading={<div className="p-2 bg-green-100 rounded-full"><LinkIcon className="h-5 w-5 text-green-600" /></div>}
              hasArrow
              onClick={() => navigate("/relationships")}
            />
          </div>
        ) : (
          <CardGrid 
            columns={{ xs: 1, sm: 2, lg: 3 }}
            gap="md"
          >
            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 scale-in" style={{ animationDelay: '0.05s' }}>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center mb-1">
                  <div className="p-2 bg-primary-100 rounded-full mr-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                  </div>
                  <CardTitle className="text-lg">创建新小说</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">在您的收藏中添加新小说</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <Button 
                  className="w-full transition-transform active:scale-[0.97]" 
                  onClick={() => navigate("/novels")}
                >
                  创建小说 <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 scale-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center mb-1">
                  <div className="p-2 bg-blue-100 rounded-full mr-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">管理角色</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">查看和编辑您的角色名单</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <Button 
                  className="w-full transition-transform active:scale-[0.97]" 
                  variant="secondary"
                  onClick={() => navigate("/characters")}
                >
                  查看角色 <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 scale-in" style={{ animationDelay: '0.15s' }}>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center mb-1">
                  <div className="p-2 bg-green-100 rounded-full mr-2">
                    <LinkIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">可视化关系</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">探索角色联系</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <Button 
                  className="w-full transition-transform active:scale-[0.97]" 
                  variant="outline"
                  onClick={() => navigate("/relationships")}
                >
                  查看关系 <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </CardGrid>
        )}
      </div>

      {/* Recent Novels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-full mr-2">
              <BookOpen className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold">最近的小说</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary flex items-center gap-1 transition-transform hover:translate-x-1"
            onClick={() => navigate("/novels")}
          >
            查看全部 <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        {novels.length > 0 ? (
          <div className="flex items-start overflow-x-auto pb-6 pt-2 px-2 gap-4 hide-scrollbar -mx-2 touch-pan-x">
            {novels.slice(0, 5).map((novel: any, index: number) => (
            <div key={novel.id} className="flex-shrink-0 w-36 sm:w-48 overflow-visible p-2 -m-2 slide-up" style={{ animationDelay: `${0.05 + index * 0.05}s` }}>
              <Card 
                className="h-full cursor-pointer group rounded-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]" 
                onClick={() => navigate(`/novels/${novel.id}`)}
              >
                <div className="relative" style={{ aspectRatio: '128/185' }}>
                  <div className="absolute inset-0 bg-gray-100 overflow-hidden">
                    {novel.coverImage ? (
                      <img 
                        src={novel.coverImage} 
                        alt={novel.title} 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <BookOpen className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-3 py-2 relative group">
                  <h4 className="text-sm font-medium truncate group-hover:text-primary-600 transition-colors">{novel.title}</h4>
                </div>
              </Card>
            </div>
            ))}
          </div>
        ) :
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-gray-500 text-sm mb-3">您还没有创建任何小说。</p>
              <Button 
                size="sm"
                onClick={() => navigate("/novels")}
              >
                创建小说
              </Button>
            </CardContent>
          </Card>
        }
      </div>
    </>
  );
}
