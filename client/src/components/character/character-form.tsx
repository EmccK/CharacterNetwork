import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCharacterSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, Loader2, User, Link as LinkIcon, Grid } from "lucide-react";
import { avatarIcons, generateColoredAvatar, utf8ToBase64 } from "@/assets/avatars";

const formSchema = insertCharacterSchema.extend({
  avatar: z.instanceof(File).optional().or(z.string().optional()),
});

type CharacterFormValues = z.infer<typeof formSchema>;

interface CharacterFormProps {
  initialData?: Partial<CharacterFormValues>;
  novelId?: number;
  novels?: any[];
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.avatar as string || null
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialData?.avatar as string || ""
  );
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("preset");

  // Set up form with default values
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      novelId: novelId || initialData?.novelId || undefined,
    },
  });

  // Handle form submission
  const mutation = useMutation({
    mutationFn: async (values: CharacterFormValues) => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("novelId", String(values.novelId));

      if (values.description) {
        formData.append("description", values.description);
      }

      // Handle image based on active tab
      if (activeTab === "upload" && selectedFile) {
        formData.append("avatar", selectedFile);
      } else if (activeTab === "url" && avatarUrl) {
        formData.append("avatarUrl", avatarUrl);
      } else if (activeTab === "preset" && selectedIcon) {
        // 如果选择了预设图标，将其添加为base64数据
        const iconData = selectedIcon;
        formData.append("avatarData", iconData);
        console.log("Adding preset icon data:", iconData.substring(0, 50) + "...");
      } else if (activeTab === "auto" && values.name) {
        // 如果是自动生成，根据名称生成头像
        const autoAvatar = generateColoredAvatar(values.name);
        const dataUrl = `data:image/svg+xml;base64,${utf8ToBase64(autoAvatar)}`;
        formData.append("avatarData", dataUrl);
        console.log("Adding auto-generated avatar data:", dataUrl.substring(0, 50) + "...");
      }

      // Different API endpoint and method based on create/update mode
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
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setAvatarUrl("");
      setSelectedIcon(null);
      setActiveTab("preset");
    },
    onError: (error: Error) => {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle URL input
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAvatarUrl(url);
    setPreviewUrl(url);
    setSelectedFile(null);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset preview if switching to upload and no file is selected
    if (value === "upload" && !selectedFile && avatarUrl) {
      setPreviewUrl(null);
    }
    // Set preview to URL if switching to url tab and URL exists
    if (value === "url" && avatarUrl) {
      setPreviewUrl(avatarUrl);
    }
    // 如果选择预设图标并已经选择了图标
    if (value === "preset" && selectedIcon) {
      setPreviewUrl(selectedIcon);
    }
    // 如果是自动生成且有名字
    if (value === "auto" && form.getValues("name")) {
      const autoAvatar = generateColoredAvatar(form.getValues("name"));
      const dataUrl = `data:image/svg+xml;base64,${utf8ToBase64(autoAvatar)}`;
      setPreviewUrl(dataUrl);
    }
  };
  
  // 处理预设图标选择
  const handleIconSelect = (icon: typeof avatarIcons[0]) => {
    const dataUrl = `data:image/svg+xml;base64,${utf8ToBase64(icon.svg)}`;
    setSelectedIcon(dataUrl);
    setPreviewUrl(dataUrl);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: CharacterFormValues) {
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
              <FormLabel>角色名称</FormLabel>
              <FormControl>
                <Input placeholder="输入角色名称" {...field} />
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
                  placeholder="角色的简要描述" 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!novelId && novels.length > 0 && (
          <FormField
            control={form.control}
            name="novelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>小说</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择小说" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {novels.map((novel) => (
                      <SelectItem key={novel.id} value={novel.id.toString()}>
                        {novel.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div>
          <FormLabel>头像</FormLabel>

          <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="preset" className="flex items-center gap-1">
                <Grid className="h-4 w-4" />
                <span>预设</span>
              </TabsTrigger>
              <TabsTrigger value="auto" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>自动</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-1">
                <ImagePlus className="h-4 w-4" />
                <span>上传</span>
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                <span>URL</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preset">
              <div className="mt-1 border-2 border-gray-300 rounded-lg p-3">
                {previewUrl && activeTab === "preset" ? (
                  <div className="space-y-2 text-center mb-3">
                    <div className="w-24 h-24 mx-auto overflow-hidden rounded-full">
                      <img 
                        src={previewUrl} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700">已选择预设头像</p>
                  </div>
                ) : (
                  <div className="mb-3 text-center">
                    <p className="text-sm text-gray-600">选择一个预设头像</p>
                  </div>
                )}
                
                <div className="grid grid-cols-4 gap-2">
                  {avatarIcons.map((icon) => (
                    <div 
                      key={icon.id} 
                      className={`p-2 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${selectedIcon && selectedIcon === `data:image/svg+xml;base64,${utf8ToBase64(icon.svg)}` ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                      onClick={() => handleIconSelect(icon)}
                      title={icon.name}
                    >
                      <div className="w-full aspect-square" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="auto">
              <div className="mt-1 border-2 border-gray-300 rounded-lg p-4">
                {form.getValues("name") ? (
                  <div className="space-y-2 text-center">
                    <div className="w-24 h-24 mx-auto overflow-hidden rounded-full">
                      <img 
                        src={`data:image/svg+xml;base64,${utf8ToBase64(generateColoredAvatar(form.getValues("name")))}`} 
                        alt="Auto avatar preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-600">根据角色名称生成的头像</p>
                    <p className="text-xs text-gray-500">如果修改了角色名称，请点击下面的按钮更新头像</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const autoAvatar = generateColoredAvatar(form.getValues("name"));
                        const dataUrl = `data:image/svg+xml;base64,${utf8ToBase64(autoAvatar)}`;
                        setPreviewUrl(dataUrl);
                        setSelectedIcon(dataUrl);
                      }}
                    >
                      更新头像
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-2">请先填写角色名称</p>
                    <p className="text-sm text-gray-400">系统将根据角色名称自动生成头像</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                {previewUrl && activeTab === "upload" ? (
                  <div className="space-y-2 text-center">
                    <div className="w-32 h-32 mx-auto overflow-hidden rounded-full">
                      <img 
                        src={previewUrl} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
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
                    <User className="mx-auto h-12 w-12 text-gray-400" />
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

            <TabsContent value="url">
              <div className="space-y-4">
                <Input 
                  placeholder="输入图片链接"
                  value={avatarUrl}
                  onChange={handleUrlChange}
                  className="w-full"
                />

                {previewUrl && activeTab === "url" && (
                  <div className="mt-2">
                    <div className="w-32 h-32 mx-auto overflow-hidden rounded-full border border-gray-200">
                      <img 
                        src={previewUrl} 
                        alt="Avatar preview from URL" 
                        className="w-full h-full object-cover"
                        onError={() => setPreviewUrl(null)}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 italic">粘贴图片的直接链接（JPG，PNG 或 GIF）</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
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