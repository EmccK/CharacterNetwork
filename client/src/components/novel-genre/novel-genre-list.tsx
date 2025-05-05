import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
import { Plus, MoreHorizontal, Loader2, BookType } from "lucide-react";
import NovelGenreForm from "./novel-genre-form";

type NovelGenre = {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  isPublic: boolean;
  createdAt: string;
};

export default function NovelGenreList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<NovelGenre | null>(null);

  // 获取小说类型列表
  const {
    data: genres = [],
    isLoading,
    error
  } = useQuery<NovelGenre[]>({
    queryKey: ["novel-genres"],
    queryFn: async () => {
      const response = await apiRequest<NovelGenre[]>("GET", "/api/genres");
      return response || [];
    },
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <span className="text-red-500">加载小说类型失败</span>
        <Button
          variant="outline"
          onClick={() => queryClient.refetchQueries({ queryKey: ["novel-genres"] })}
        >
          重试
        </Button>
      </div>
    );
  }

  // 删除小说类型
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/genres/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novel-genres"] });
      toast({
        title: "类型已删除",
        description: "小说类型已成功删除",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "删除失败",
        description: error.message || "无法删除小说类型",
        variant: "destructive",
      });
    },
  });

  const handleAddGenre = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditGenre = (genre: NovelGenre) => {
    setSelectedGenre(genre);
    setIsEditDialogOpen(true);
  };

  const handleDeleteGenre = (genre: NovelGenre) => {
    setSelectedGenre(genre);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedGenre) {
      deleteMutation.mutate(selectedGenre.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">小说类型</h2>
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
            {genres.length} 种类型
          </span>
        </div>
        <Button onClick={handleAddGenre} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> 添加类型
        </Button>
      </div>

      {genres.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gray-100 rounded-full">
                <BookType className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              您还没有创建任何小说类型。点击"添加类型"按钮开始创建。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {genres.map((genre: NovelGenre) => (
            <Card key={genre.id} className="hover:shadow-sm transition-all hover:border-primary-100 bg-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-medium">{genre.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuLabel className="text-xs font-medium">操作</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => handleEditGenre(genre)}
                        className="text-sm cursor-pointer"
                      >
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteGenre(genre)}
                        className="text-sm text-red-600 cursor-pointer"
                      >
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {genre.isPublic && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    公开
                  </span>
                )}
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <p className="text-xs text-gray-500 line-clamp-2">
                  {genre.description || "无描述"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 添加类型对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加小说类型</DialogTitle>
          </DialogHeader>
          <NovelGenreForm
            onSuccess={() => {
              setIsAddDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ["novel-genres"] });
              toast({
                title: "类型已添加",
                description: "小说类型已成功添加",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑类型对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑小说类型</DialogTitle>
          </DialogHeader>
          {selectedGenre && (
            <NovelGenreForm
              initialData={selectedGenre}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["novel-genres"] });
                toast({
                  title: "类型已更新",
                  description: "小说类型已成功更新",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除类型 "{selectedGenre?.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                "删除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}