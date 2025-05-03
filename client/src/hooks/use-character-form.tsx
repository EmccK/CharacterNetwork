import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { insertCharacterSchema } from "@shared/schema";

// 定义表单架构和值类型
const formSchema = insertCharacterSchema.extend({
  avatar: z.instanceof(File).optional().or(z.string().optional()),
});

type CharacterFormValues = z.infer<typeof formSchema>;

// 头像数据类型
export interface AvatarData {
  file?: File | null;
  url?: string | null;
  dataUrl?: string | null;
  method: 'upload' | 'url' | 'preset' | 'auto' | null;
}

// 钩子参数类型
interface UseCharacterFormProps {
  initialData?: Partial<CharacterFormValues>;
  mode?: 'create' | 'update';
  characterId?: number;
  onSuccess?: () => void;
  form: UseFormReturn<CharacterFormValues>;
}

export function useCharacterForm({ 
  initialData,
  mode = 'create',
  characterId,
  onSuccess,
  form
}: UseCharacterFormProps) {
  const { toast } = useToast();
  const [avatarData, setAvatarData] = useState<AvatarData>({
    method: null
  });

  // 处理头像变化
  const handleAvatarChange = (data: AvatarData) => {
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

  const onSubmit = (values: CharacterFormValues) => {
    mutation.mutate(values);
  };

  return {
    avatarData,
    handleAvatarChange,
    mutation,
    onSubmit
  };
}
