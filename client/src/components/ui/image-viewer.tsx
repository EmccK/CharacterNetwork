import React from 'react';

// 用于测试图片和SVG显示的组件
interface ImageViewerProps {
  src: string;
  width?: number;
  height?: number;
}

export function ImageViewer({ src, width = 200, height = 200 }: ImageViewerProps) {
  // 检查是否是SVG或Base64数据
  const isSvg = src?.startsWith('<svg') || src?.startsWith('data:image/svg+xml');
  
  return (
    <div className="border border-gray-300 rounded overflow-hidden" style={{ width, height }}>
      <div className="text-xs text-gray-500 bg-gray-100 p-1 border-b border-gray-300">
        {isSvg ? 'SVG/Base64 数据' : '图片 URL'}
      </div>
      <div className="flex items-center justify-center h-full bg-white p-2">
        {src ? (
          isSvg && src.startsWith('<svg') ? (
            <div dangerouslySetInnerHTML={{ __html: src }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <img 
              src={src} 
              alt="预览" 
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.error('Image load error:', e);
                e.currentTarget.style.display = 'none';
              }} 
            />
          )
        ) : (
          <div className="text-center text-gray-400">无图像数据</div>
        )}
      </div>
      <div className="text-xs text-gray-500 bg-gray-100 p-1 border-t border-gray-300 break-all">
        {src ? `${src.substring(0, 30)}...` : '无数据'}
      </div>
    </div>
  );
}
