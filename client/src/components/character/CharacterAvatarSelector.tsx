import { useState, useEffect } from "react";
import { 
  FormLabel, 
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, User, Link as LinkIcon, Grid } from "lucide-react";
import { avatarIcons, generateColoredAvatar, utf8ToBase64 } from "@/assets/avatars";
import { UseFormReturn } from "react-hook-form";

interface CharacterAvatarSelectorProps {
  form: UseFormReturn<any>;
  initialAvatar?: string | null;
  onAvatarChange: (data: { 
    file?: File | null, 
    url?: string | null,
    dataUrl?: string | null,
    method: 'upload' | 'url' | 'preset' | 'auto'
  }) => void;
}

/**
 * 角色头像选择器组件
 * 提供4种头像设置方式：预设图标、自动生成、文件上传和URL
 */
export default function CharacterAvatarSelector({ 
  form, 
  initialAvatar,
  onAvatarChange
}: CharacterAvatarSelectorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatar || null);
  const [avatarUrl, setAvatarUrl] = useState<string>(initialAvatar || "");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("preset");

  // 当角色名称变化时更新自动生成的头像
  useEffect(() => {
    if (activeTab === "auto" && form.getValues("name")) {
      updateAutoAvatar();
    }
  }, [form.watch("name"), activeTab]);

  // 处理预设图标选择
  const handleIconSelect = (icon: typeof avatarIcons[0]) => {
    const dataUrl = `data:image/svg+xml;base64,${utf8ToBase64(icon.svg)}`;
    setSelectedIcon(dataUrl);
    setPreviewUrl(dataUrl);
    
    onAvatarChange({
      dataUrl,
      method: 'preset'
    });
  };

  // 处理URL输入
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAvatarUrl(url);
    setPreviewUrl(url);
    setSelectedFile(null);
    
    onAvatarChange({
      url,
      method: 'url'
    });
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        
        onAvatarChange({
          file,
          method: 'upload'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // 更新自动生成的头像
  const updateAutoAvatar = () => {
    const name = form.getValues("name");
    if (name) {
      const autoAvatar = generateColoredAvatar(name);
      const dataUrl = `data:image/svg+xml;base64,${utf8ToBase64(autoAvatar)}`;
      setPreviewUrl(dataUrl);
      setSelectedIcon(dataUrl);
      
      onAvatarChange({
        dataUrl,
        method: 'auto'
      });
    }
  };

  // 处理标签切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // 根据不同的标签页，进行相应的处理
    if (value === "upload") {
      if (selectedFile) {
        onAvatarChange({
          file: selectedFile,
          method: 'upload'
        });
      } else {
        setPreviewUrl(null);
      }
    } else if (value === "url") {
      if (avatarUrl) {
        setPreviewUrl(avatarUrl);
        onAvatarChange({
          url: avatarUrl,
          method: 'url'
        });
      } else {
        setPreviewUrl(null);
      }
    } else if (value === "preset") {
      if (selectedIcon) {
        setPreviewUrl(selectedIcon);
        onAvatarChange({
          dataUrl: selectedIcon,
          method: 'preset'
        });
      } else {
        setPreviewUrl(null);
      }
    } else if (value === "auto") {
      updateAutoAvatar();
    }
  };

  return (
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

        {/* 预设图标选择器 */}
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
        
        {/* 自动生成头像 */}
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
                  onClick={updateAutoAvatar}
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

        {/* 文件上传 */}
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

        {/* URL输入 */}
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
                    onError={() => {
                      setPreviewUrl(null);
                      onAvatarChange({ method: 'url', url: null });
                    }}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 italic">粘贴图片的直接链接（JPG，PNG 或 GIF）</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}