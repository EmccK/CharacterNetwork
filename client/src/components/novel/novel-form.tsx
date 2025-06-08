import { useState } from "react";
import { z } from "zod";
import { insertNovelSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  // 表单容器组件
  FormContainer,
  FormItem,
  FormLabel,
  FormMessage
} from "../ui/custom-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, Loader2, Link as LinkIcon } from "lucide-react";
import useForm from "@/hooks/use-form";
import useFileUpload from "@/hooks/use-file-upload";
import useApiMutation from "@/hooks/use-api-mutation";

const formSchema = insertNovelSchema.extend({
  coverImage: z.instanceof(File).optional().or(z.string().optional()),
  id: z.number().optional(),
});

type NovelFormValues = z.infer<typeof formSchema>;

interface NovelFormProps {
  initialData?: Partial<NovelFormValues & { id?: number }>;
  onSuccess?: () => void;
}

export default function NovelForm({ 
  initialData,
  onSuccess 
}: NovelFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(initialData?.coverImage ? "url" : "upload");
  
  // 获取用户的小说类型列表
  const { data: genreList } = useQuery({
    queryKey: ["novel-genres"],
    queryFn: async () => {
      const response = await apiRequest<any[]>("GET", "/api/genres");
      return response || [];
    },
    select: (data) => Array.isArray(data) ? data : []
  });

  // 使用自定义文件上传hook
  const {
    fileState,
    handleFileChange,
    resetFileState,
    setFileFromUrl
  } = useFileUpload({
    maxSizeInMB: 10,
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    previewBeforeUpload: true
  });

  // 初始化文件URL（如果有）
  useState(() => {
    if (initialData?.coverImage && typeof initialData.coverImage === 'string') {
      setFileFromUrl(initialData.coverImage);
    }
  });

  // 使用自定义表单hook
  const { 
    values, 
    errors, 
    handleChange, 
    handleSubmit, 
    setFieldValue 
  } = useForm<NovelFormValues>({
    initialValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      genre: initialData?.genre || "",
      status: initialData?.status || "In Progress",
      userId: user?.id ?? 0,
      id: initialData?.id,
    },
    validate: (values) => {
      const errors: Partial<Record<keyof NovelFormValues, string>> = {};
      
      if (!values.title) {
        errors.title = "标题不能为空";
      }
      
      return errors;
    }
  });

  // 确定是编辑还是创建
  const isEditing = !!initialData?.id;

  // 处理URL输入
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFileFromUrl(url);
  };

  // 处理标签切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // 重置预览如果切换到上传并且没有选择文件
    if (value === "upload" && !fileState.file && fileState.fileUrl) {
      resetFileState();
    }
  };

  // 使用API修改hook
  const mutation = useApiMutation<any, Error, FormData>(
    isEditing ? `/api/novels/${initialData?.id}` : "/api/novels",
    isEditing ? "PUT" : "POST",
    {
      onSuccess: () => {
        toast({
          title: isEditing ? "小说已更新" : "小说已创建",
          description: `您的小说已成功${isEditing ? '更新' : '创建'}`,
        });
        if (onSuccess) onSuccess();
        if (!isEditing) {
          // 重置表单
          setFieldValue("title", "");
          setFieldValue("description", "");
          setFieldValue("genre", "");
          setFieldValue("status", "In Progress");
          resetFileState();
        }
      },
      onError: (error) => {
        toast({
          title: "错误",
          description: error.message,
          variant: "destructive",
        });
      },
      showSuccessToast: false
    }
  );

  // 处理表单提交
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    const formData = new FormData();
    formData.append("title", values.title);
    
    // 如果不是编辑模式，添加userId
    if (!isEditing) {
      formData.append("userId", String(user?.id));
    }

    // 即使字段为空也要发送，以便后端能正确处理
    formData.append("description", values.description || "");
    formData.append("genre", values.genre || "");
    formData.append("status", values.status || "In Progress");

    // 处理图片
    if (activeTab === "upload" && fileState.file) {
      formData.append("coverImage", fileState.file);
    } else if (activeTab === "url" && fileState.fileUrl) {
      formData.append("coverImageUrl", fileState.fileUrl);
    } else if (initialData?.coverImage && typeof initialData.coverImage === 'string') {
      // 如果没有新上传的图片，并且有初始封面，保留原有封面
      formData.append("coverImageUrl", initialData.coverImage);
    }
    
    // 调试信息
    console.log("提交表单数据：", {
      url: isEditing ? `/api/novels/${initialData?.id}` : "/api/novels",
      method: isEditing ? "PUT" : "POST",
      title: values.title,
      description: values.description,
      genre: values.genre,
      status: values.status,
      isEditing: isEditing
    });

    mutation.mutate(formData);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <FormItem>
            <FormLabel>小说标题</FormLabel>
            <Input
              placeholder="输入小说标题"
              name="title"
              value={values.title}
              onChange={handleChange}
            />
            {errors.title && <FormMessage>{errors.title}</FormMessage>}
          </FormItem>
        </div>

        <div className="md:col-span-2">
          <FormItem>
            <FormLabel>描述</FormLabel>
            <Textarea
              placeholder="小说简介"
              rows={3}
              name="description"
              value={values.description || ""}
              onChange={handleChange}
            />
            {errors.description && <FormMessage>{errors.description}</FormMessage>}
          </FormItem>
        </div>

        <FormItem>
          <FormLabel>类型</FormLabel>
          <select
            value={values.genre || ""}
            onChange={(e) => setFieldValue("genre", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">选择类型</option>
            {/* 用户自定义类型 */}
            <optgroup label="自定义类型">
              {(genreList || []).map((genre: any, index: number) => (
                <option key={genre.id || index} value={genre.name || `自定义类型${index+1}`}>
                  {genre.name || `自定义类型${index+1}`}
                </option>
              ))}
            </optgroup>
            <optgroup label="默认类型">
              <option value="奇幻">奇幻</option>
              <option value="科幻">科幻</option>
              <option value="悬疑">悬疑</option>
              <option value="爱情">爱情</option>
              <option value="历史">历史</option>
              <option value="惊悚">惊悚</option>
              <option value="恐怖">恐怖</option>
              <option value="其他">其他</option>
            </optgroup>
          </select>
          {errors.genre && <FormMessage>{errors.genre}</FormMessage>}
        </FormItem>

        <FormItem>
          <FormLabel>状态</FormLabel>
          <select
            value={values.status || "In Progress"}
            onChange={(e) => setFieldValue("status", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="In Progress">进行中</option>
            <option value="Completed">已完成</option>
            <option value="Planning">计划中</option>
            <option value="On Hold">暂停</option>
          </select>
          {errors.status && <FormMessage>{errors.status}</FormMessage>}
        </FormItem>

        <div className="md:col-span-2">
          <FormLabel className="block mb-2">封面图片</FormLabel>
          <Tabs 
            value={activeTab}
            className="mt-2" 
            onValueChange={handleTabChange}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <ImagePlus className="w-4 h-4 mr-2" />
                上传图片
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="w-4 h-4 mr-2" />
                图片链接
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                {fileState.previewUrl && activeTab === "upload" ? (
                  <div className="space-y-2 text-center">
                    <div className="aspect-[128/185] w-40 mx-auto overflow-hidden rounded-md">
                      <img 
                        src={fileState.previewUrl} 
                        alt="Cover preview" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex text-sm">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                      >
                        <span>更改文件</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                      >
                        <span>上传文件</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">或拖放至此处</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF 格式，最大 10MB</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="url" className="mt-4">
              <div className="space-y-4">
                <div className="flex flex-col">
                  <Input 
                    type="text" 
                    placeholder="输入图片链接" 
                    value={fileState.fileUrl || ""}
                    onChange={handleUrlChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    输入图片的直接链接（.jpg，.png，.gif）
                  </p>
                </div>

                {fileState.previewUrl && activeTab === "url" && (
                  <div className="aspect-[128/185] w-40 mx-auto overflow-hidden rounded-md">
                    <img 
                      src={fileState.previewUrl} 
                      alt="Cover preview" 
                      className="w-full h-full object-contain"
                      onError={() => resetFileState()}
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.state.isLoading}>
          {mutation.state.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "更新中..." : "创建中..."}
            </>
          ) : (
            isEditing ? "更新小说" : "创建小说"
          )}
        </Button>
      </div>
    </form>
  );
}