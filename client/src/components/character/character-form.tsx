import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCharacterSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Novel } from "@shared/schema";
import CharacterBasicInfo from "./CharacterBasicInfo";
import CharacterNovelSelector from "./CharacterNovelSelector";
import CharacterAvatarSelector from "./CharacterAvatarSelector";

const formSchema = insertCharacterSchema.extend({
  avatar: z.instanceof(File).optional().or(z.string().optional()),
});

type CharacterFormValues = z.infer<typeof formSchema>;

interface CharacterFormProps {
  initialData?: Partial<CharacterFormValues>;
  novelId?: number;
  novels?: Novel[];
  onSuccess?: () => void;
  mode?: 'create' | 'update';
  characterId?: number;
}

export default function CharacterForm({ 
  initialData,
  novelId,
  novels = [],
  onSuccess,
  mode = 'create',
  characterId
}: CharacterFormProps) {
  const { toast } = useToast();
  const [avatarData, setAvatarData] = useState<{
    file?: File | null,
    url?: string | null,
    dataUrl?: string | null,
    method: 'upload' | 'url' | 'preset' | 'auto' | null
  }>({
    method: null
  });

  // 设置表单，使用默认值
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      novelId: novelId || initialData?.novelId || undefined,
    },
  });

  // 处理头像变化
  const handleAvatarChange = (data: {
    file?: File | null,
    url?: string | null,
    dataUrl?: string | null,
    method: 'upload' | 'url' | 'preset' | 'auto'
  }) => {
    setAvatarData(data);
  };

  // 处理表单提交
  const mutation = useMutation({
    mutationFn: async (values: CharacterFormValues) => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("novelId", String(values.novelId));

      if (values.description) {
        formData.append("description", values.description);
      }

      // 根据不同的头像设置方式处理
      if (avatarData.method === 'upload' && avatarData.file) {
        formData.append("avatar", avatarData.file);
      } else if (avatarData.method === 'url' && avatarData.url) {
        formData.append("avatarUrl", avatarData.url);
      } else if ((avatarData.method === 'preset' || avatarData.method === 'auto') && avatarData.dataUrl) {
        formData.append("avatarData", avatarData.dataUrl);
      }

      // 根据模式选择不同的API端点和方法
      const endpoint = mode === 'create' ? "/api/characters" : `/api/characters/${characterId}`;
      const method = mode === 'create' ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method: method,
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create character");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: mode === 'create' ? "角色已创建" : "角色已更新",
        description: mode === 'create' ? "您的角色已成功创建" : "您的角色已成功更新",
      });
      if (onSuccess) onSuccess();
      
      // 重置表单和状态
      if (mode === 'create') {
        form.reset();
        setAvatarData({ method: null });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: CharacterFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本信息区域 */}
        <CharacterBasicInfo form={form} />
        
        {/* 小说选择区域 */}
        <CharacterNovelSelector 
          form={form} 
          novels={novels} 
          novelId={novelId} 
        />
        
        {/* 头像选择区域 */}
        <CharacterAvatarSelector 
          form={form}
          initialAvatar={initialData?.avatar as string}
          onAvatarChange={handleAvatarChange}
        />

        {/* 提交按钮 */}
        <div className="flex justify-end mt-6">
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full sm:w-auto py-5 sm:py-3 transition-transform active:scale-[0.98] text-base"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? '创建中...' : '更新中...'}
              </>
            ) : (
              mode === 'create' ? "创建角色" : "更新角色"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}