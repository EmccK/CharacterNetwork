import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import NovelCard from "@/components/novel/novel-card";
import NovelForm from "@/components/novel/novel-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCcw, Plus, FilterIcon, BookIcon, ArrowRight } from "lucide-react";

export default function NovelsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch novels
  const { data: novels = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/novels"],
    queryFn: () => fetch("/api/novels", { credentials: "include" }).then(res => res.json()),
  });

  // Delete novel mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/novels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novels"] });
      // 更新角色和关系计数
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
      queryClient.invalidateQueries({ queryKey: ["allRelationships"] });
      toast({
        title: "小说已删除",
        description: "小说已成功删除",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "删除小说失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and sort novels
  const filteredNovels = (novels as any[])
    .filter((novel: any) => {
      // Apply genre filter
      if (genreFilter !== "all" && novel.genre !== genreFilter) return false;

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return novel.title.toLowerCase().includes(query) ||
               (novel.description && novel.description.toLowerCase().includes(query));
      }

      return true;
    })
    .sort((a: any, b: any) => {
      // Apply sorting
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "updated":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  // Get unique genres for filter dropdown
  const uniqueGenres = Array.from(new Set((novels as any[]).map((novel: any) => novel.genre).filter(Boolean)));

  const handleDeleteNovel = (id: number) => {
    if (window.confirm("您确定要删除这部小说吗？此操作无法撤销。")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">我的小说</h3>
          <Button
            className="bg-primary-600 hover:bg-primary-700"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" /> 添加小说
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="搜索小说..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <FilterIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="所有类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有类型</SelectItem>
              {(uniqueGenres as string[]).map((genre: string) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">最近更新</SelectItem>
              <SelectItem value="created">最近创建</SelectItem>
              <SelectItem value="title">按字母排序</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Novel Waterfall Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredNovels.length > 0 ? (
          <>
            <div className="waterfall-grid mb-6">
              {/* 添加小说卡片 */}
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer"
                  onClick={() => setIsCreateModalOpen(true)}>
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary-600" />
                </div>
                <p className="text-gray-600 text-center font-medium">添加新小说</p>
              </div>

              {/* 导入书籍卡片 */}
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer"
                  onClick={() => navigate('/import-book')}>
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <BookIcon className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-600 text-center font-medium">从书籍导入</p>
                <p className="text-gray-400 text-center text-xs mt-2">从外部数据源导入书籍信息</p>
              </div>

              {/* 现有小说卡片 */}
              {filteredNovels.map((novel: any) => (
                <NovelCard
                  key={novel.id}
                  novel={novel}
                  onView={() => navigate(`/novels/${novel.id}`)}
                  onEdit={() => navigate(`/novels/${novel.id}`)}
                  onDelete={() => handleDeleteNovel(novel.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="flex justify-center">
              <div className="bg-gray-100 p-3 rounded-full">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">未找到小说</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || genreFilter !== "all"
                ? "尝试改变您的搜索或过滤条件"
                : "从添加您的第一部小说开始"}
            </p>
            <div className="mt-6 flex gap-2 justify-center">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> 添加小说
              </Button>
              <Button variant="outline" onClick={() => navigate('/import-book')}>
                <BookIcon className="mr-1 h-4 w-4" /> 从书籍导入
              </Button>
            </div>
          </div>
        )}

        {/* Pagination (simplified) */}
        {filteredNovels.length > 0 && (
          <div className="mt-6 flex justify-center">
            <nav className="inline-flex rounded-md shadow">
              <Button variant="outline" size="sm" className="rounded-l-md">
                &larr;
              </Button>
              <Button variant="outline" size="sm" className="rounded-none bg-primary-600 border-primary-600 text-white">
                1
              </Button>
              <Button variant="outline" size="sm" className="rounded-r-md">
                &rarr;
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* Create Novel Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加新小说</DialogTitle>
            <DialogDescription>
              创建一部新小说以开始跟踪角色及其关系。
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4 bg-blue-50 p-4 rounded-md flex items-start">
            <BookIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-700">想从现有图书数据自动填充信息？</p>
              <div className="mt-2">
                <Button
                  variant="link"
                  className="h-auto p-0 text-blue-600"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    navigate('/import-book');
                  }}
                >
                  使用图书导入 <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          <NovelForm
            onSuccess={() => {
              setIsCreateModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/novels"] });
              // 更新侧边栏计数
              queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
              queryClient.invalidateQueries({ queryKey: ["allRelationships"] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
