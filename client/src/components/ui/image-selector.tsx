import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card } from './card';

interface ImageSelectorProps {
  initialImage?: string;
  onImageSelected: (data: {
    file?: File | null;
    url?: string | null;
    dataUrl?: string | null;
    method: 'upload' | 'url' | 'preset' | 'auto';
  }) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
  presetImages?: string[];
  showUrlOption?: boolean;
  showPresetOption?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

/**
 * 通用图片选择器组件，支持上传、URL输入和预设图片选择
 */
export const ImageSelector: React.FC<ImageSelectorProps> = ({
  initialImage,
  onImageSelected,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSizeMB = 5,
  presetImages = [],
  showUrlOption = true,
  showPresetOption = true,
  className = '',
  label = '选择图片',
  description
}) => {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 如果初始图片更新，更新预览
  useEffect(() => {
    if (initialImage) {
      setPreviewUrl(initialImage);
      
      // 判断初始图片是否为URL或预设图片
      if (initialImage.startsWith('http')) {
        setActiveTab('url');
        setImageUrl(initialImage);
      } else if (presetImages.includes(initialImage)) {
        setActiveTab('preset');
        setSelectedPreset(initialImage);
      }
    }
  }, [initialImage, presetImages]);

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(`不支持的文件类型。请上传 ${allowedTypes.join(', ')} 格式的图片。`);
      return;
    }

    // 检查文件大小
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`文件大小超过限制 (${maxSizeMB}MB)。`);
      return;
    }

    // 创建预览URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      onImageSelected({
        file,
        dataUrl,
        method: 'upload'
      });
    };
    reader.readAsDataURL(file);
    setErrorMessage(null);
  };

  // 处理URL输入
  const handleUrlSubmit = () => {
    if (!imageUrl) {
      setErrorMessage('请输入有效的图片URL。');
      return;
    }

    // 简单的URL验证
    if (!imageUrl.match(/^(https?:\/\/)/i)) {
      setErrorMessage('请输入有效的图片URL，以http://或https://开头。');
      return;
    }

    setPreviewUrl(imageUrl);
    onImageSelected({
      url: imageUrl,
      method: 'url'
    });
    setErrorMessage(null);
  };

  // 处理预设图片选择
  const handlePresetSelect = (imageUrl: string) => {
    setSelectedPreset(imageUrl);
    setPreviewUrl(imageUrl);
    onImageSelected({
      dataUrl: imageUrl,
      method: 'preset'
    });
    setErrorMessage(null);
  };

  // 清除选择
  const handleClear = () => {
    setPreviewUrl(null);
    setImageUrl('');
    setSelectedPreset(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelected({
      file: null,
      url: null,
      dataUrl: null,
      method: 'auto'
    });
    setErrorMessage(null);
  };

  // 构建Tabs
  const tabs = [
    { id: 'upload', label: '上传', show: true },
    { id: 'url', label: 'URL', show: showUrlOption },
    { id: 'preset', label: '预设', show: showPresetOption && presetImages.length > 0 }
  ].filter(tab => tab.show);

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label>{label}</Label>}
      {description && <p className="text-sm text-muted-foreground mb-2">{description}</p>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 上传选项 */}
        <TabsContent value="upload" className="space-y-4 pt-4">
          <div className="grid w-full items-center gap-1.5">
            <Input
              ref={fileInputRef}
              id="image-upload"
              type="file"
              accept={allowedTypes.join(',')}
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              支持 {allowedTypes.map(type => type.replace('image/', '')).join(', ')} 格式，最大 {maxSizeMB}MB
            </p>
          </div>
        </TabsContent>

        {/* URL选项 */}
        {showUrlOption && (
          <TabsContent value="url" className="space-y-4 pt-4">
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <Input
                  type="url"
                  placeholder="输入图片URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleUrlSubmit}
                  size="sm"
                >
                  确定
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                输入图片的完整URL，以http://或https://开头
              </p>
            </div>
          </TabsContent>
        )}

        {/* 预设选项 */}
        {showPresetOption && presetImages.length > 0 && (
          <TabsContent value="preset" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {presetImages.map((image, index) => (
                <div
                  key={index}
                  className={`
                    relative aspect-square rounded-md overflow-hidden cursor-pointer border-2
                    ${selectedPreset === image ? 'border-primary' : 'border-transparent'}
                  `}
                  onClick={() => handlePresetSelect(image)}
                >
                  <img
                    src={image}
                    alt={`预设图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* 错误消息 */}
      {errorMessage && (
        <div className="text-destructive text-sm mt-2">{errorMessage}</div>
      )}

      {/* 预览区域 */}
      {previewUrl && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <Label>预览</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              type="button"
            >
              清除
            </Button>
          </div>
          <div className="aspect-square w-32 h-32 rounded-md overflow-hidden border">
            <img
              src={previewUrl}
              alt="图片预览"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};
