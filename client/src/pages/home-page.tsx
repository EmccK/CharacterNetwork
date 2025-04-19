import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BookOpen, Users, Link, BookMarked, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Get novels count
  const { data: novels = [] } = useQuery({
    queryKey: ["/api/novels"],
  });

  // 获取所有角色总数
  const [charactersCount, setCharactersCount] = useState(0);
  const [relationshipsCount, setRelationshipsCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);

  // 获取每个小说的角色和关系
  useEffect(() => {
    if (novels.length > 0) {
      let totalCharacters = 0;
      let totalRelationships = 0;
      let inProgressNovels = 0;

      const fetchData = async () => {
        for (const novel of novels) {
          // 获取角色
          try {
            const characters = await queryClient.fetchQuery({
              queryKey: [`/api/novels/${novel.id}/characters`],
            });
            if (Array.isArray(characters)) {
              totalCharacters += characters.length;
            }

            // 获取关系
            const relationships = await queryClient.fetchQuery({
              queryKey: [`/api/novels/${novel.id}/relationships`],
            });
            if (Array.isArray(relationships)) {
              totalRelationships += relationships.length;
            }

            // 检查小说状态
            if (novel.status === "In Progress") {
              inProgressNovels++;
            }
          } catch (error) {
            console.error(`Error fetching data for novel ${novel.id}:`, error);
          }
        }

        setCharactersCount(totalCharacters);
        setRelationshipsCount(totalRelationships);
        setInProgressCount(inProgressNovels);
      };

      fetchData();
    }
  }, [novels, queryClient]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="仪表盘" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">欢迎，{user?.username}！</h1>
            <p className="text-gray-600">在一处管理您的小说、角色和它们的关系。</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="bg-primary-100 p-3 rounded-full mr-4">
                  <BookOpen className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">小说总数</p>
                  <h3 className="text-2xl font-bold">{novels.length}</h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">角色</p>
                  <h3 className="text-2xl font-bold">{charactersCount}</h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Link className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">关系</p>
                  <h3 className="text-2xl font-bold">{relationshipsCount}</h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="bg-amber-100 p-3 rounded-full mr-4">
                  <BookMarked className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">进行中</p>
                  <h3 className="text-2xl font-bold">{inProgressCount}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">创建新小说</CardTitle>
                  <CardDescription>在您的收藏中添加新小说</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/novels")}
                  >
                    创建小说 <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">管理角色</CardTitle>
                  <CardDescription>查看和编辑您的角色名单</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={() => navigate("/characters")}
                  >
                    查看角色 <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">可视化关系</CardTitle>
                  <CardDescription>探索角色联系</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate("/relationships")}
                  >
                    查看关系 <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
            </div>

          {/* Recent Novels */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">最近的小说</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary flex items-center gap-1"
                onClick={() => navigate("/novels")}
              >
                查看全部 <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            {novels.length > 0 ? (
              <div className="flex items-start overflow-x-auto pb-6 pt-2 px-2 gap-4 hide-scrollbar -mx-2">
                {novels.slice(0, 5).map((novel: any) => (
                <div key={novel.id} className="flex-shrink-0 w-48 overflow-visible p-2 -m-2">
                  <Card 
                    className="h-full cursor-pointer group rounded-lg overflow-hidden transform transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]" 
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
            ) : (
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
