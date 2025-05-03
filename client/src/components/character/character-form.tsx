import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCharacterSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Novel } from "@shared/schema";
import CharacterBasicInfo from "./CharacterBasicInfo";
import CharacterNovelSelector from "./CharacterNovelSelector";
import CharacterAvatarSelector from "./CharacterAvatarSelector";
import { useCharacterForm } from "@/hooks/use-character-form";

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
  // 设置表单，使用默认值
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      novelId: novelId || initialData?.novelId || undefined,
    },
  });

  // 使用自定义hook管理表单逻辑
  const { avatarData, handleAvatarChange, mutation, onSubmit } = useCharacterForm({
    initialData,
    mode,
    characterId,
    onSuccess,
    form
  });

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