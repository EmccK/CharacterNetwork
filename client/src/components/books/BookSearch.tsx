import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, BookIcon } from "lucide-react";
import { BookInfo } from '@shared/schema';

// API请求函数
const searchBooks = async (query: string): Promise<BookInfo[]> => {
  // 使用后端代理路由去访问微信读书API
  const response = await fetch(`/api/weread/search?keyword=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('搜索书籍失败');
  }
  
  // 解析微信读书API的返回结果
  const data = await response.json();
  const bookResults: BookInfo[] = [];
  
  // 直接处理新API返回的books数组
  if (data.books && data.books.length > 0) {
    for (const book of data.books) {
      const bookInfo = book.bookInfo;
      if (bookInfo) {
        // 生成唯一ID
        const id = parseInt(bookInfo.bookId);
        
        // 生成类别数组 - 如果有评分细节可以加入类别
        const categories: string[] = [];
        if (bookInfo.newRatingDetail && bookInfo.newRatingDetail.title) {
          categories.push(bookInfo.newRatingDetail.title);
        }
        
        const bookData: BookInfo = {
          id,
          externalId: bookInfo.bookId,
          title: bookInfo.title,
          author: bookInfo.author || '',
          description: bookInfo.intro || '',
          coverImage: bookInfo.cover ? bookInfo.cover.replace('/s_', '/t6_') : '',  // 替换封面图片URL以获取更高分辨率图片
          publishedDate: '',
          publisher: bookInfo.publisher || '',
          isbn: '',
          pageCount: 0,
          categories,
          language: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // 添加额外属性，评分等
        (bookData as any).rating = bookInfo.newRating;
        (bookData as any).ratingCount = bookInfo.newRatingCount;
        (bookData as any).payType = bookInfo.payType;
        (bookData as any).readingCount = book.readingCount || 0;
        
        bookResults.push(bookData);
      }
    }
  }
  
  return bookResults;
};

export interface BookSearchProps {
  onSelectBook: (book: BookInfo) => void;
  setExternalSearchQuery?: (query: string) => void; // 新增方法属性
}

const BookSearch: React.FC<BookSearchProps> = ({ onSelectBook, setExternalSearchQuery }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // 提供外部调用的方法
  useEffect(() => {
    if (setExternalSearchQuery) {
      setExternalSearchQuery(searchQuery);
    }
  }, [setExternalSearchQuery, searchQuery]);

  // 当用户输入时，设置一个延迟进行搜索
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.trim().length > 0) { // 改为只要有1个字符就触发
      const timeout = setTimeout(() => {
        setDebouncedQuery(value);
      }, 500); // 500毫秒延迟
      setSearchTimeout(timeout as unknown as NodeJS.Timeout);
    } else if (value.trim().length === 0) {
      setDebouncedQuery('');
    }
  };

  // 执行搜索查询
  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      // 清除之前的timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      // 直接设置搜索查询
      setDebouncedQuery(searchQuery);
    }
  };

  // 处理按下回车键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 日志搜索请求和响应，与调试
  const { data: books, isLoading, isError, error } = useQuery({
    queryKey: ['bookSearch', debouncedQuery],
    queryFn: async () => {
      console.log('正在搜索:', debouncedQuery);
      try {
        const result = await searchBooks(debouncedQuery);
        console.log('搜索结果:', result);
        return result;
      } catch (err) {
        console.error('搜索错误:', err);
        throw err;
      }
    },
    enabled: debouncedQuery.trim().length > 0,
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          id="book-search-input"
          type="text"
          placeholder="输入书名、作者搜索书籍..."
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-grow"
        />
        <Button variant="default" onClick={handleSearch} disabled={searchQuery.trim().length < 1}>
          <SearchIcon className="h-4 w-4 mr-2" />
          搜索
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-52">
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center p-4 bg-red-50 text-red-500 rounded-md">
          搜索出错: {(error as Error).message}
        </div>
      )}

      {books && books.length === 0 && debouncedQuery && (
        <div className="text-center p-4 bg-gray-50 text-gray-500 rounded-md">
          未找到匹配的书籍
        </div>
      )}

      {books && books.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <Card key={book.id} className="overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => onSelectBook(book)}>
              <div className="flex h-full">
                {book.coverImage ? (
                  <img 
                    src={book.coverImage} 
                    alt={book.title} 
                    className="w-24 h-32 object-cover m-3"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // 防止无限循环
                      target.src = ''; // 清除错误的图片源
                      const parent = target.parentNode;
                      if (parent) {
                        const bookIcon = document.createElement('div');
                        bookIcon.className = 'w-24 h-32 bg-gray-200 flex items-center justify-center m-3';
                        bookIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
                        parent.replaceChild(bookIcon, target);
                      }
                    }}
                  />
                ) : (
                  <div className="w-24 h-32 bg-gray-200 flex items-center justify-center m-3">
                    <BookIcon className="text-gray-400" />
                  </div>
                )}
                <div className="flex flex-col p-3 flex-grow">
                  <CardTitle className="text-base font-semibold line-clamp-2">{book.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{book.author}</p>
                  {book.publishedDate && book.publishedDate.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{book.publishedDate}</p>
                  )}
                  <div className="mt-auto">
                    {/* 如果有评分信息，显示评分 */}
                    {(book as any).rating && (
                      <p className="text-xs text-orange-500 font-medium mt-2">
                        评分: {((book as any).rating / 100).toFixed(1)} 
                        {(book as any).ratingCount && (
                          <span className="text-gray-400">({Math.floor((book as any).ratingCount/10000)}w+评)</span>
                        )}
                      </p>
                    )}
                    {/* 显示付费类型 */}
                    {typeof (book as any).payType === 'number' && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${(book as any).payType === 1048577 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} mr-2`}>
                        {(book as any).payType === 1048577 ? '付费' : '免费'}
                      </span>
                    )}
                    {book.categories && Array.isArray(book.categories) && book.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(book.categories as string[]).slice(0, 2).map((category, idx) => (
                          <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookSearch;
