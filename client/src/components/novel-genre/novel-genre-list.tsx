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
import { Plus, MoreHorizontal, Loader2 } from "lucide-react";
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
  const { data: genres = [], isLoading } = useQuery({
    queryKey: ["/api/novel-genres"],
  });

  // 删除小说类型
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/novel-genres/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/novel-genres"] });
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
        <h2 className="text-2xl font-bold">小说类型管理</h2>
        <Button onClick={handleAddGenre}>
          <Plus className="h-4 w-4 mr-2" /> 添加类型
        </Button>
      </div>

      {genres.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-4 text-center">
            <p className="text-muted-foreground">
              您还没有创建任何小说类型。点击"添加类型"按钮开始创建。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {genres.map((genre) => (
            <Card key={genre.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{genre.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditGenre(genre)}>编辑</DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteGenre(genre)}
                        className="text-red-600"
                      >
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {genre.isPublic && (
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                    公开
                  </span>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
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
              queryClient.invalidateQueries({ queryKey: ["/api/novel-genres"] });
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
                queryClient.invalidateQueries({ queryKey: ["/api/novel-genres"] });
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