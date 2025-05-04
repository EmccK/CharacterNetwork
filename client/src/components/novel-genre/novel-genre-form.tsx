import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

// 表单验证模式
const formSchema = z.object({
  name: z.string().min(1, "类型名称不能为空").max(50, "类型名称不能超过50个字符"),
  description: z.string().max(200, "描述不能超过200个字符").optional(),
  isPublic: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface NovelGenreFormProps {
  initialData?: {
    id: number;
    name: string;
    description: string | null;
    isPublic: boolean;
  };
  onSuccess?: () => void;
}

export default function NovelGenreForm({ 
  initialData,
  onSuccess 
}: NovelGenreFormProps) {
  const { toast } = useToast();
  const isEditing = !!initialData?.id;

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      isPublic: initialData?.isPublic || false,
    },
  });

  // 提交表单处理
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const url = isEditing 
        ? `/api/genres/${initialData.id}` 
        : "/api/genres";
      
      const method = isEditing ? "PUT" : "POST";
      
      return await apiRequest(method, url, values);
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
      
      if (!isEditing) {
        form.reset();
      }
      // 刷新小说类型列表
      queryClient.invalidateQueries({ queryKey: ["novel-genres"] });
    },
    onError: (error: any) => {
      toast({
        title: "提交失败",
        description: error.message || `无法${isEditing ? '更新' : '创建'}小说类型`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>类型名称</FormLabel>
              <FormControl>
                <Input placeholder="输入类型名称" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>描述</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="类型描述（选填）" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                简短描述此类型的特点（可选）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>公开此类型</FormLabel>
                <FormDescription>
                  公开的类型可以被其他用户使用。非公开类型仅对您可见。
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "更新中..." : "创建中..."}
            </>
          ) : (
            isEditing ? "更新类型" : "创建类型"
          )}
        </Button>
      </form>
    </Form>
  );
}