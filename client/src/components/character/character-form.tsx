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
import { ImagePlus, Loader2, User, Link as LinkIcon } from "lucide-react";

const formSchema = insertCharacterSchema.extend({
  avatar: z.instanceof(File).optional().or(z.string().optional()),
});

type CharacterFormValues = z.infer<typeof formSchema>;

interface CharacterFormProps {
  initialData?: Partial<CharacterFormValues>;
  novelId?: number;
  novels?: any[];
  onSuccess?: () => void;
}

export default function CharacterForm({ 
  initialData,
  novelId,
  novels = [],
  onSuccess 
}: CharacterFormProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.avatar as string || null
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialData?.avatar as string || ""
  );
  const [activeTab, setActiveTab] = useState<string>("upload");

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
      }

      const response = await fetch("/api/characters", {
        method: "POST",
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
        title: "角色已创建",
        description: "您的角色已成功创建",
      });
      if (onSuccess) onSuccess();
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setAvatarUrl("");
      setActiveTab("upload");
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
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4" />
                <span>上传</span>
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <span>URL</span>
              </TabsTrigger>
            </TabsList>

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
                创建中...
              </>
            ) : (
              "创建角色"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
