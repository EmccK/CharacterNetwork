import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// 表单验证规则
const formSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题最多100个字符"),
  content: z.string().optional(),
  novelId: z.number().int().positive(),
  characterIds: z.array(z.number().int()).optional(),
  labels: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Character {
  id: number;
  name: string;
  avatar?: string | null;
}

interface Note {
  id: number;
  title: string;
  content: string | null;
  novelId: number;
  characterIds: number[] | null;
  labels: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface NoteFormProps {
  novelId: number;
  initialData?: Note;
  characters?: Character[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NoteForm({ 
  novelId, 
  initialData, 
  characters = [],
  onSuccess, 
  onCancel 
}: NoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>(
    initialData?.characterIds?.filter(Boolean) as number[] || []
  );
  const [labels, setLabels] = useState<string[]>(
    initialData?.labels?.filter(Boolean) as string[] || []
  );
  const [newLabel, setNewLabel] = useState("");
  
  // 设置表单默认值
  const defaultValues: FormData = {
    title: initialData?.title || "",
    content: initialData?.content || "",
    novelId: novelId,
    characterIds: initialData?.characterIds?.filter(Boolean) as number[] || [],
    labels: initialData?.labels?.filter(Boolean) as string[] || [],
  };
  
  // 初始化表单
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // 提交表单
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      // 设置角色IDs和标签
      data.characterIds = selectedCharacterIds;
      data.labels = labels;
      
      if (initialData?.id) {
        // 更新笔记
        await apiRequest("PUT", `/api/notes/${initialData.id}`, data);
      } else {
        // 创建笔记
        await apiRequest("POST", "/api/notes", data);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("保存笔记失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 添加标签
  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel("");
    }
  };
  
  // 删除标签
  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter(l => l !== label));
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 标题 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标题</FormLabel>
              <FormControl>
                <Input placeholder="笔记标题" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* 内容 */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>内容</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="笔记内容..." 
                  className="min-h-32 resize-none" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* 相关角色 - 使用Checkbox */}
        {characters.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">相关角色</h3>
            <div className="grid grid-cols-2 gap-3">
              {characters.map((character) => (
                <div key={character.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`character-${character.id}`}
                    checked={selectedCharacterIds.includes(character.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCharacterIds([...selectedCharacterIds, character.id]);
                      } else {
                        setSelectedCharacterIds(
                          selectedCharacterIds.filter((id) => id !== character.id)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`character-${character.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {character.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 标签 */}
        <div className="space-y-2">
          <FormLabel>标签</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {labels.map((label, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {label}
                <button 
                  type="button" 
                  className="ml-1" 
                  onClick={() => handleRemoveLabel(label)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="添加标签" 
              value={newLabel} 
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLabel();
                }
              }}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAddLabel}
              disabled={!newLabel.trim()}
            >
              添加
            </Button>
          </div>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : initialData?.id ? "更新笔记" : "添加笔记"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 