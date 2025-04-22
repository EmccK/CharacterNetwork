import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { BookInfo } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookIcon, ArrowLeftIcon, PlusIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookDetailProps {
  book: BookInfo;
  onBack: () => void;
}

// 直接从搜索结果创建小说的API请求函数
const createNovelFromSearchBook = async (book: BookInfo): Promise<any> => {
  try {
    console.log('从搜索结果中创建小说，书籍数据:', {
      title: book.title,
      externalId: book.externalId,
      externalIdType: typeof book.externalId,
      categories: book.categories,
      rating: (book as any).rating
    });
    
    // 直接发送全部数据给新的API端点
    const response = await fetch('/api/novels/from-search-book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookData: {
          externalId: book.externalId,
          title: book.title,
          author: book.author || '',
          description: book.description || '',
          coverImage: book.coverImage || '',
          publishedDate: book.publishedDate || '',
          publisher: book.publisher || '',
          isbn: book.isbn || '',
          pageCount: book.pageCount || 0,
          categories: book.categories || [],
          language: book.language || 'zh',
          // 传递微信读书特有字段
          rating: (book as any).rating,
          ratingCount: (book as any).ratingCount,
          payType: (book as any).payType
        },
        status: 'In Progress'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('请求失败:', response.status, response.statusText);
      console.error('创建小说失败响应:', errorData);
      throw new Error(errorData.message || '创建小说失败');
    }

    const novel = await response.json();
    console.log('小说创建成功响应:', novel);
    return novel;
  } catch (error) {
    console.error('创建小说过程中出错:', error);
    throw error;
  }
};

const BookDetail: React.FC<BookDetailProps> = ({ book, onBack }) => {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // 使用React Query进行创建小说的变异操作
  const { mutate, isPending } = useMutation({
    mutationFn: createNovelFromSearchBook,
    onSuccess: (data) => {
      toast({
        title: '小说创建成功',
        description: `已从"${book.title}"创建小说`,
      });
      navigate(`/novels/${data.id}`);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: '创建失败',
        description: (error as Error).message,
      });
    },
  });

  const handleCreateNovel = () => {
    mutate(book);
  };

  // 提取和格式化分类
  const categories = book.categories && Array.isArray(book.categories) 
    ? book.categories as string[] 
    : [];

  return (
    <div className="w-full space-y-4">
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        返回搜索结果
      </Button>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{book.title}</CardTitle>
          {book.author && <CardDescription>作者: {book.author}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {book.coverImage ? (
              <img 
                src={book.coverImage} 
                alt={book.title} 
                className="w-36 h-48 object-cover self-center md:self-start"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = 'none';
                  const parent = target.parentNode;
                  if (parent) {
                    const bookIcon = document.createElement('div');
                    bookIcon.className = 'w-36 h-48 bg-gray-200 flex items-center justify-center';
                    bookIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
                    parent.appendChild(bookIcon);
                  }
                }}
              />
            ) : (
              <div className="w-36 h-48 bg-gray-200 flex items-center justify-center self-center md:self-start">
                <BookIcon size={48} className="text-gray-400" />
              </div>
            )}

            <div className="flex-grow space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">详细信息</h3>
                <ul className="mt-1 space-y-1">
                  {book.publishedDate && book.publishedDate.length > 0 && (
                    <li className="text-sm">出版日期: {book.publishedDate}</li>
                  )}
                  {/* 显示额外的微信读书信息 */}
                  {(book as any).rating && (
                    <li className="text-sm text-orange-500 font-medium">
                      评分: {((book as any).rating / 100).toFixed(1)} 
                      {(book as any).ratingCount && (
                        <span className="text-gray-500 font-normal">({Math.floor((book as any).ratingCount/10000)}w+评)</span>
                      )}
                    </li>
                  )}
                  {typeof (book as any).payType === 'number' && (
                    <li className="text-sm">
                      类型: 
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${(book as any).payType === 1048577 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {(book as any).payType === 1048577 ? '付费' : '免费'}
                      </span>
                    </li>
                  )}
                  {book.publisher && (
                    <li className="text-sm">出版社: {book.publisher}</li>
                  )}
                  {book.isbn && (
                    <li className="text-sm">ISBN: {book.isbn}</li>
                  )}
                  {book.pageCount && book.pageCount > 0 && (
                    <li className="text-sm">页数: {book.pageCount}</li>
                  )}
                  {book.language && (
                    <li className="text-sm">语言: {book.language === 'zh' ? '中文' : 
                                               book.language === 'en' ? '英文' : 
                                               book.language}</li>
                  )}
                </ul>
              </div>

              {categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">分类</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {categories.map((category, idx) => (
                      <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {book.description && book.description.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">描述</h3>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-line max-h-40 overflow-y-auto">
                    {book.description}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">作品信息</h3>
                  <p className="mt-1 text-sm text-gray-700">
                    该书暂无详细描述信息。
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleCreateNovel} 
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? '创建中...' : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                从此书创建小说
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default BookDetail;
