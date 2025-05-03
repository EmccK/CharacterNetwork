import { useState, useCallback, ChangeEvent } from 'react';

export interface FileUploadOptions {
  maxSizeInMB?: number;
  acceptedFileTypes?: string[];
  onUploadStart?: () => void;
  onUploadSuccess?: (url: string, file: File) => void;
  onUploadError?: (error: Error) => void;
  previewBeforeUpload?: boolean;
}

export interface FileUploadState {
  file: File | null;
  fileUrl: string | null;
  isUploading: boolean;
  progress: number;
  error: Error | null;
  previewUrl: string | null;
}

export interface UseFileUploadReturn {
  fileState: FileUploadState;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  uploadFile: () => Promise<string | null>;
  resetFileState: () => void;
  setFileFromUrl: (url: string) => void;
}

/**
 * 自定义文件上传Hook
 * 提供文件选择、预览、上传等功能
 */
function useFileUpload({
  maxSizeInMB = 5,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  onUploadStart,
  onUploadSuccess,
  onUploadError,
  previewBeforeUpload = true,
}: FileUploadOptions = {}): UseFileUploadReturn {
  // 文件上传状态
  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    fileUrl: null,
    isUploading: false,
    progress: 0,
    error: null,
    previewUrl: null,
  });

  // 重置文件状态
  const resetFileState = useCallback(() => {
    // 如果有预览URL，释放它以避免内存泄漏
    if (fileState.previewUrl) {
      URL.revokeObjectURL(fileState.previewUrl);
    }
    
    setFileState({
      file: null,
      fileUrl: null,
      isUploading: false,
      progress: 0,
      error: null,
      previewUrl: null,
    });
  }, [fileState.previewUrl]);

  // 处理文件选择
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (!selectedFile) {
      resetFileState();
      return;
    }
    
    // 验证文件类型
    if (acceptedFileTypes.length > 0 && !acceptedFileTypes.includes(selectedFile.type)) {
      setFileState({
        file: null,
        fileUrl: null,
        isUploading: false,
        progress: 0,
        error: new Error(`不支持的文件类型。请上传 ${acceptedFileTypes.join(', ')} 类型的文件。`),
        previewUrl: null,
      });
      return;
    }
    
    // 验证文件大小
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (selectedFile.size > maxSizeInBytes) {
      setFileState({
        file: null,
        fileUrl: null,
        isUploading: false,
        progress: 0,
        error: new Error(`文件太大。最大允许大小为 ${maxSizeInMB}MB。`),
        previewUrl: null,
      });
      return;
    }
    
    // 创建预览URL（如果是图片类型）
    let previewUrl = null;
    if (previewBeforeUpload && selectedFile.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(selectedFile);
    }
    
    // 更新状态
    setFileState({
      file: selectedFile,
      fileUrl: null,
      isUploading: false,
      progress: 0,
      error: null,
      previewUrl,
    });
  }, [acceptedFileTypes, maxSizeInMB, previewBeforeUpload, resetFileState]);

  // 从URL设置文件
  const setFileFromUrl = useCallback((url: string) => {
    setFileState({
      file: null,
      fileUrl: url,
      isUploading: false,
      progress: 100,
      error: null,
      previewUrl: url,
    });
  }, []);

  // 上传文件到服务器
  const uploadFile = useCallback(async (): Promise<string | null> => {
    if (!fileState.file) {
      // 如果已经有URL但没有文件（可能是从URL设置的），直接返回URL
      if (fileState.fileUrl) {
        return fileState.fileUrl;
      }
      return null;
    }
    
    try {
      setFileState(prev => ({
        ...prev,
        isUploading: true,
        progress: 0,
        error: null,
      }));
      
      if (onUploadStart) {
        onUploadStart();
      }
      
      // 创建FormData对象
      const formData = new FormData();
      
      // 根据文件类型判断上传字段名
      const fieldName = fileState.file.type.startsWith('image/') ? 'avatar' : 'coverImage';
      
      formData.append(fieldName, fileState.file);
      
      // 使用fetch API上传文件
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // 不设置Content-Type，让浏览器自动设置，包含boundary
      });
      
      if (!response.ok) {
        throw new Error(`上传失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const fileUrl = result.url;
      
      setFileState(prev => ({
        ...prev,
        fileUrl,
        isUploading: false,
        progress: 100,
      }));
      
      if (onUploadSuccess) {
        onUploadSuccess(fileUrl, fileState.file);
      }
      
      return fileUrl;
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('上传过程中发生未知错误');
      
      setFileState(prev => ({
        ...prev,
        isUploading: false,
        error: uploadError,
      }));
      
      if (onUploadError) {
        onUploadError(uploadError);
      }
      
      return null;
    }
  }, [fileState.file, fileState.fileUrl, onUploadStart, onUploadSuccess, onUploadError]);

  return {
    fileState,
    handleFileChange,
    uploadFile,
    resetFileState,
    setFileFromUrl,
  };
}

export default useFileUpload;