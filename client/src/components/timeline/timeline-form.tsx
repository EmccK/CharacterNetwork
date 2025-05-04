import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// 定义表单的验证模式
const formSchema = z.object({
  title: z.string().min(1, { message: '事件标题不能为空' }),
  description: z.string().optional(),
  date: z.string().min(1, { message: '日期不能为空' }),
  importance: z.string().min(1, { message: '请选择重要性' }),
  characterIds: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TimelineFormProps {
  novelId: number;
  characters?: { id: number; name: string }[];
  timelineEvent?: {
    id: number;
    title: string;
    description?: string;
    date: string;
    importance: string;
    characterIds: number[];
  };
  onSuccess: () => void;
  mode?: 'create' | 'edit';
}

const TimelineForm: React.FC<TimelineFormProps> = ({
  novelId,
  characters = [],
  timelineEvent,
  onSuccess,
  mode = 'create',
}) => {
  const { toast } = useToast();
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>(
    timelineEvent?.characterIds || []
  );
  
  // 设置默认值
  const defaultValues: FormValues = {
    title: timelineEvent?.title || '',
    description: timelineEvent?.description || '',
    date: timelineEvent?.date || '',
    importance: timelineEvent?.importance || 'normal',
    characterIds: timelineEvent?.characterIds || [],
  };

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // 处理表单提交的函数
  const onSubmit = async (values: FormValues) => {
    try {
      // 添加所选角色ID
      values.characterIds = selectedCharacterIds;
      
      if (mode === 'create') {
        // 创建新的时间线事件
        await createMutation.mutateAsync({
          ...values,
          novelId,
        });
      } else {
        // 更新现有时间线事件
        await updateMutation.mutateAsync({
          ...values,
          id: timelineEvent?.id,
        });
      }
      
      // 提交成功后调用回调函数
      onSuccess();
    } catch (error) {
      console.error('提交时间线事件表单出错:', error);
      toast({
        variant: 'destructive',
        title: mode === 'create' ? '创建时间线事件失败' : '更新时间线事件失败',
        description: (error as Error).message,
      });
    }
  };

  // 创建时间线事件的变异
  const createMutation = useMutation({
    mutationFn: (data: FormValues & { novelId: number }) =>
      apiRequest('POST', `/api/novels/${novelId}/timeline-events`, data),
  });

  // 更新时间线事件的变异
  const updateMutation = useMutation({
    mutationFn: (data: FormValues & { id?: number }) =>
      apiRequest(
        'PUT',
        `/api/timeline-events/${data.id}`,
        data
      ),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标题</FormLabel>
              <FormControl>
                <Input placeholder="请输入事件标题" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>日期</FormLabel>
              <FormControl>
                <Input placeholder="请输入事件日期" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="importance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>重要性</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择重要性" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="minor">次要</SelectItem>
                  <SelectItem value="normal">普通</SelectItem>
                  <SelectItem value="important">重要</SelectItem>
                  <SelectItem value="critical">关键</SelectItem>
                </SelectContent>
              </Select>
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
                  placeholder="请输入事件详细描述（可选）"
                  className="resize-none"
                  rows={4}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* 角色选择部分 */}
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
        
        <div className="flex justify-end">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending
              ? '提交中...'
              : mode === 'create'
              ? '创建事件'
              : '更新事件'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TimelineForm;
